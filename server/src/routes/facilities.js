const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, get, run } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLogger');

// GET /api/facilities (List facilities, filter by locality or sport)
router.get('/', (req, res) => {
    const { locality_id, sport } = req.query;
    let sql = 'SELECT * FROM facilities WHERE 1=1';
    const params = [];

    if (locality_id) {
        sql += ' AND locality_id = ?';
        params.push(locality_id);
    }
    if (sport) {
        sql += ' AND sports LIKE ?';
        params.push(`%${sport}%`);
    }

    const facilities = query(sql, params).map(f => ({
        ...f,
        is_usable: f.verification_status !== 'unverified' && f.coach_present === 1 && f.equipment_ok === 1
    }));

    res.json({ facilities });
});

// POST /api/facilities (Add a new sports facility / ground)
router.post('/', authenticateToken, requireRole(['teacher_coach', 'officer', 'admin']), (req, res) => {
    const {
        locality_id,
        name,
        lat,
        lon,
        sports,
        equipment_ok = 0,
        coach_present = 0,
        weekly_sessions = 0,
        participants_per_session = 0,
        fee_level = 'free'
    } = req.body;

    if (!locality_id || !name || lat === undefined || lon === undefined) {
        return res.status(400).json({ error: 'Missing required facility fields.' });
    }

    const id = `FAC-${uuidv4().substring(0, 8)}`;
    const verificationStatus = req.user.role === 'officer' || req.user.role === 'admin'
        ? 'officer_verified'
        : 'teacher_confirmed';

    run(`
        INSERT INTO facilities (
            id, locality_id, name, lat, lon, sports, equipment_ok, coach_present,
            weekly_sessions, participants_per_session, fee_level, verification_status, is_simulated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
        id, locality_id, name, lat, lon, sports || 'badminton',
        equipment_ok ? 1 : 0, coach_present ? 1 : 0,
        weekly_sessions, participants_per_session, fee_level, verificationStatus
    ]);

    recordAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'CREATE_FACILITY',
        entityType: 'facility',
        entityId: id,
        details: { name, locality_id, sports, verificationStatus },
        ipAddress: req.ip
    });

    res.status(201).json({
        message: 'Facility registered successfully.',
        facility: {
            id,
            locality_id,
            name,
            verification_status: verificationStatus
        }
    });
});

// PUT /api/facilities/:id/verify (Update verification status)
router.put('/:id/verify', authenticateToken, requireRole(['teacher_coach', 'officer', 'admin']), (req, res) => {
    const { id } = req.params;
    const { verification_status, coach_present, equipment_ok } = req.body;

    const facility = get('SELECT * FROM facilities WHERE id = ?', [id]);
    if (!facility) {
        return res.status(404).json({ error: 'Facility not found.' });
    }

    const newStatus = req.user.role === 'officer' || req.user.role === 'admin'
        ? (verification_status || 'officer_verified')
        : 'teacher_confirmed';

    run(`
        UPDATE facilities
        SET verification_status = ?,
            coach_present = COALESCE(?, coach_present),
            equipment_ok = COALESCE(?, equipment_ok)
        WHERE id = ?
    `, [newStatus, coach_present !== undefined ? (coach_present ? 1 : 0) : null, equipment_ok !== undefined ? (equipment_ok ? 1 : 0) : null, id]);

    recordAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'VERIFY_FACILITY',
        entityType: 'facility',
        entityId: id,
        details: { previous: facility.verification_status, updated: newStatus },
        ipAddress: req.ip
    });

    res.json({ message: 'Facility verification status updated.', id, status: newStatus });
});

module.exports = router;
