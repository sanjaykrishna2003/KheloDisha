const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, get } = require('../db/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLogger');

// List of standard demo users for one-click switching
const DEMO_USER_KEYS = {
    admin: 'admin@khelodisha.gov.in',
    district_officer: 'officer.district@khelodisha.gov.in',
    block_officer: 'officer.block_b@khelodisha.gov.in',
    teacher_coach: 'coach.sundargarh@khelodisha.gov.in',
    player_parent: 'parent.rahul@khelodisha.gov.in',
    sponsor: 'csr.tatasteel@sports.org',
    public: 'public@khelodisha.gov.in'
};

function generateUserToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role,
            officer_level: user.officer_level,
            full_name: user.full_name,
            locality_id: user.locality_id
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = generateUserToken(user);

    recordAudit({
        userId: user.id,
        userRole: user.role,
        action: 'USER_LOGIN',
        entityType: 'user',
        entityId: user.id,
        details: { username: user.username },
        ipAddress: req.ip
    });

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            officer_level: user.officer_level,
            full_name: user.full_name,
            locality_id: user.locality_id
        }
    });
});

// POST /api/auth/demo-switch (Quick persona switcher for evaluation)
router.post('/demo-switch', (req, res) => {
    const { role_key } = req.body;
    const targetUsername = DEMO_USER_KEYS[role_key] || role_key;

    const user = get('SELECT * FROM users WHERE username = ? OR role = ?', [targetUsername, role_key]);
    if (!user) {
        return res.status(404).json({ error: `Demo user for role '${role_key}' not found.` });
    }

    const token = generateUserToken(user);

    recordAudit({
        userId: user.id,
        userRole: user.role,
        action: 'DEMO_SWITCH',
        entityType: 'user',
        entityId: user.id,
        details: { switched_to_role: user.role },
        ipAddress: req.ip
    });

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            officer_level: user.officer_level,
            full_name: user.full_name,
            locality_id: user.locality_id
        }
    });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// GET /api/auth/demo-personas
router.get('/demo-personas', (req, res) => {
    const users = query('SELECT id, username, role, officer_level, full_name, locality_id FROM users');
    res.json({ personas: users });
});

module.exports = router;
