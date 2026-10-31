const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLogger');

// GET /api/sessions (Attendance records for a locality or facility)
router.get('/', (req, res) => {
    const { locality_id, facility_id, sport = 'badminton' } = req.query;

    let sql = 'SELECT * FROM sessions_attendance WHERE sport = ?';
    const params = [sport];

    if (locality_id) {
        sql += ' AND locality_id = ?';
        params.push(locality_id);
    }
    if (facility_id) {
        sql += ' AND facility_id = ?';
        params.push(facility_id);
    }

    sql += ' ORDER BY date DESC LIMIT 50';

    const sessions = query(sql, params);
    res.json({ sessions });
});

// POST /api/sessions (Teacher or Coach recording session attendance)
router.post('/', authenticateToken, requireRole(['teacher_coach', 'officer', 'admin']), (req, res) => {
    const {
        facility_id,
        locality_id,
        sport = 'badminton',
        date,
        attendee_count,
        girls_count
    } = req.body;

    if (!facility_id || !locality_id || attendee_count === undefined || girls_count === undefined) {
        return res.status(400).json({ error: 'Missing required session attendance fields.' });
    }

    const id = `ATT-${uuidv4().substring(0, 8)}`;
    const sessionDate = date || new Date().toISOString().split('T')[0];

    run(`
        INSERT INTO sessions_attendance (
            id, facility_id, locality_id, sport, date, attendee_count, girls_count, reporter_id, is_simulated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [id, facility_id, locality_id, sport, sessionDate, attendee_count, girls_count, req.user.id]);

    recordAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'RECORD_SESSION_ATTENDANCE',
        entityType: 'session_attendance',
        entityId: id,
        details: { locality_id, facility_id, attendee_count, girls_count },
        ipAddress: req.ip
    });

    res.status(201).json({
        message: 'Session attendance recorded successfully.',
        id,
        attendee_count,
        girls_count
    });
});

module.exports = router;
