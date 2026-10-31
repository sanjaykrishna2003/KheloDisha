const express = require('express');
const router = express.Router();
const { query } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/audit (Admin audit log inspection)
router.get('/', authenticateToken, requireRole(['admin']), (req, res) => {
    const { limit = 50, action, entity_type } = req.query;

    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    if (action) {
        sql += ' AND action LIKE ?';
        params.push(`%${action}%`);
    }
    if (entity_type) {
        sql += ' AND entity_type = ?';
        params.push(entity_type);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(Number(limit));

    const logs = query(sql, params).map(l => ({
        ...l,
        details: l.details ? (typeof l.details === 'string' && l.details.startsWith('{') ? JSON.parse(l.details) : l.details) : null
    }));

    res.json({ logs });
});

module.exports = router;
