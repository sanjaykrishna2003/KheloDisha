const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, get, run, transaction } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { verifyParentalConsent } = require('../middleware/consentGate');
const { protectSmallGroup, pseudonymizePlayerRecord } = require('../middleware/privacy');
const { recordAudit } = require('../middleware/auditLogger');

// POST /api/players/register (Guardian registering child with mandatory consent gate)
router.post('/register', authenticateToken, verifyParentalConsent, (req, res) => {
    const {
        age_band,
        gender,
        school,
        locality_id,
        sport_interest,
        consent
    } = req.body;

    if (!age_band || !gender || !locality_id || !sport_interest) {
        return res.status(400).json({ error: 'Missing required fields: age_band, gender, locality_id, sport_interest.' });
    }

    const pseudoId = `PLY-${Math.floor(10000 + Math.random() * 90000)}`;
    const playerId = `REC-${uuidv4().substring(0, 8)}`;
    const consentId = `CNS-${uuidv4().substring(0, 8)}`;

    try {
        transaction(() => {
            // 1. Create guardian consent record
            const guardianName = consent ? consent.guardian_name : (req.body.guardian_name || req.user.full_name);
            const guardianContact = consent ? consent.guardian_contact : (req.body.guardian_contact || '+91 94370 00000');
            const purpose = consent ? consent.purpose : 'Khelo India Youth Sports Participation & Coaching';

            run(`
                INSERT INTO consents (id, player_pseudo_id, guardian_name, guardian_contact, purpose, status, granted_at)
                VALUES (?, ?, ?, ?, ?, 'granted', CURRENT_TIMESTAMP)
            `, [consentId, pseudoId, guardianName, guardianContact, purpose]);

            // 2. Insert player with consent link and activation
            run(`
                INSERT INTO players (id, pseudo_id, age_band, gender, school, locality_id, sport_interest, is_active, consent_id, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `, [playerId, pseudoId, age_band, gender, school || 'Local High School', locality_id, sport_interest, consentId, req.user.id]);

            recordAudit({
                userId: req.user.id,
                userRole: req.user.role,
                action: 'REGISTER_PLAYER_WITH_CONSENT',
                entityType: 'player',
                entityId: pseudoId,
                details: { pseudo_id: pseudoId, age_band, gender, locality_id, sport_interest },
                ipAddress: req.ip
            });
        });

        res.status(201).json({
            message: 'Player successfully registered with verified parental consent.',
            player: {
                pseudo_id: pseudoId,
                age_band,
                gender,
                sport_interest,
                locality_id,
                is_active: 1,
                consent_status: 'granted'
            }
        });
    } catch (err) {
        console.error('Registration failed:', err);
        res.status(500).json({ error: 'Failed to complete registration.' });
    }
});

// GET /api/players/my-children (Parent viewing their registered children)
router.get('/my-children', authenticateToken, requireRole(['player_parent', 'admin']), (req, res) => {
    const players = query(`
        SELECT p.*, c.status as consent_status, c.guardian_name, c.granted_at, l.name as locality_name
        FROM players p
        JOIN consents c ON p.consent_id = c.id
        LEFT JOIN localities l ON p.locality_id = l.id
        WHERE p.user_id = ?
    `, [req.user.id]);

    res.json({ players });
});

// POST /api/players/withdraw-consent (Guardian withdrawing consent - deactivates child record)
router.post('/withdraw-consent', authenticateToken, requireRole(['player_parent', 'admin']), (req, res) => {
    const { player_pseudo_id, reason } = req.body;

    if (!player_pseudo_id) {
        return res.status(400).json({ error: 'Player pseudonymous ID is required.' });
    }

    const player = get('SELECT * FROM players WHERE pseudo_id = ? AND user_id = ?', [player_pseudo_id, req.user.id]);
    if (!player && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: You may only withdraw consent for your own child.' });
    }

    transaction(() => {
        run(`
            UPDATE consents
            SET status = 'withdrawn', withdrawn_at = CURRENT_TIMESTAMP
            WHERE player_pseudo_id = ?
        `, [player_pseudo_id]);

        run(`
            UPDATE players
            SET is_active = 0
            WHERE pseudo_id = ?
        `, [player_pseudo_id]);

        recordAudit({
            userId: req.user.id,
            userRole: req.user.role,
            action: 'WITHDRAW_PARENTAL_CONSENT',
            entityType: 'consent',
            entityId: player_pseudo_id,
            details: { reason: reason || 'Guardian request', deactivated: true },
            ipAddress: req.ip
        });
    });

    res.json({
        message: 'Parental consent has been withdrawn. The player record has been immediately deactivated.',
        pseudo_id: player_pseudo_id,
        status: 'withdrawn'
    });
});

// GET /api/players/locality/:localityId (Officer/Teacher view: Strictly pseudonymous, small-group suppressed)
router.get('/locality/:localityId', authenticateToken, requireRole(['officer', 'teacher_coach', 'admin']), (req, res) => {
    const { localityId } = req.params;

    const players = query(`
        SELECT pseudo_id, age_band, gender, school, sport_interest, is_active, locality_id
        FROM players
        WHERE locality_id = ? AND is_active = 1
    `, [localityId]);

    // Apply small-group suppression protection
    const count = players.length;
    const demographicCheck = protectSmallGroup(count, {
        total_active: count,
        girls_count: players.filter(p => p.gender === 'female').length,
        boys_count: players.filter(p => p.gender === 'male').length
    });

    if (demographicCheck.suppressed) {
        return res.json({
            locality_id: localityId,
            summary: demographicCheck,
            players: [],
            message: 'Group too small to display (<10 registered athletes, suppressed for child privacy)'
        });
    }

    res.json({
        locality_id: localityId,
        summary: demographicCheck,
        // Return only pseudonymous identifiers without real names
        players: players.map(p => pseudonymizePlayerRecord(p, req.user))
    });
});

module.exports = router;
