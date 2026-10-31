const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, get, run, transaction } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { TRUST_WEIGHTS } = require('../scoring/engine');
const { recordAudit } = require('../middleware/auditLogger');

const VALID_CATEGORIES = [
    'no_ground', 'no_coach', 'cost', 'distance',
    'safety', 'equipment', 'overcrowding', 'awareness', 'exams'
];

// POST /api/reports (Submit barrier report or sync offline batch)
router.post('/', authenticateToken, (req, res) => {
    // Support both single report object or batch array from offline sync
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    const reporterRole = req.user.role === 'admin' ? 'officer' : (req.user.role || 'player_parent');
    const defaultTrust = TRUST_WEIGHTS[reporterRole] || 0.5;
    const nowIso = new Date().toISOString().split('T')[0];

    transaction(() => {
        for (const item of items) {
            const {
                locality_id,
                sport = 'badminton',
                category,
                notes,
                date = nowIso,
                reporter_pseudo_id
            } = item;

            if (!locality_id || !category) continue;
            if (!VALID_CATEGORIES.includes(category)) continue;

            const pseudoId = reporter_pseudo_id || (req.user.id.startsWith('PLY') ? req.user.id : `PLY-${uuidv4().substring(0, 6)}`);

            // Check deduplication within 30 days: same reporter + locality + sport + category
            const existing = get(`
                SELECT id, date, trust_level FROM barrier_reports
                WHERE reporter_pseudo_id = ? AND locality_id = ? AND sport = ? AND category = ?
                AND (julianday(?) - julianday(date)) <= 30
                ORDER BY date DESC LIMIT 1
            `, [pseudoId, locality_id, sport, category, date]);

            if (existing) {
                // Update latest
                run(`
                    UPDATE barrier_reports
                    SET date = ?, notes = ?, trust_level = MAX(trust_level, ?)
                    WHERE id = ?
                `, [date, notes || '', defaultTrust, existing.id]);
                results.push({ id: existing.id, status: 'updated_deduplicated' });
            } else {
                const id = `REP-${uuidv4().substring(0, 8)}`;
                run(`
                    INSERT INTO barrier_reports (
                        id, locality_id, sport, category, reporter_role,
                        trust_level, reporter_pseudo_id, notes, status, date, is_simulated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, 0)
                `, [
                    id, locality_id, sport, category, reporterRole,
                    defaultTrust, pseudoId, notes || '', date
                ]);
                results.push({ id, status: 'created' });
            }
        }

        recordAudit({
            userId: req.user.id,
            userRole: req.user.role,
            action: 'SUBMIT_BARRIER_REPORTS',
            entityType: 'barrier_report',
            entityId: results.length > 0 ? results[0].id : null,
            details: { count: results.length, batch: items.length > 1 },
            ipAddress: req.ip
        });
    });

    res.status(201).json({
        message: `Processed ${results.length} barrier reports successfully.`,
        synced_count: results.length,
        results
    });
});

// GET /api/reports/locality/:localityId
router.get('/locality/:localityId', (req, res) => {
    const { localityId } = req.params;
    const { sport = 'badminton' } = req.query;

    const reports = query(`
        SELECT id, locality_id, sport, category, reporter_role,
               trust_level, status, notes, date
        FROM barrier_reports
        WHERE locality_id = ? AND sport = ?
        ORDER BY date DESC
        LIMIT 100
    `, [localityId, sport]);

    res.json({ reports });
});

// PUT /api/reports/:id/confirm (Teacher or Officer confirming a ground report)
router.put('/:id/confirm', authenticateToken, requireRole(['teacher_coach', 'officer', 'admin']), (req, res) => {
    const { id } = req.params;
    const report = get('SELECT * FROM barrier_reports WHERE id = ?', [id]);

    if (!report) {
        return res.status(404).json({ error: 'Report not found.' });
    }

    const newStatus = req.user.role === 'officer' || req.user.role === 'admin'
        ? 'officer_verified'
        : 'teacher_confirmed';
    const newTrust = newStatus === 'officer_verified' ? 1.0 : 0.8;

    run(`
        UPDATE barrier_reports
        SET status = ?, trust_level = ?
        WHERE id = ?
    `, [newStatus, newTrust, id]);

    recordAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'CONFIRM_BARRIER_REPORT',
        entityType: 'barrier_report',
        entityId: id,
        details: { previous_status: report.status, updated_status: newStatus, trust_level: newTrust },
        ipAddress: req.ip
    });

    res.json({
        message: 'Report confirmed successfully.',
        id,
        status: newStatus,
        trust_level: newTrust
    });
});

module.exports = router;
