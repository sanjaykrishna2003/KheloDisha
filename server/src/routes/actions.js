const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, get, run, transaction } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLogger');

// GET /api/actions (List all actions with overdue status calculation)
router.get('/', (req, res) => {
    const { locality_id, status } = req.query;
    let sql = `
        SELECT a.*, l.name as locality_name, l.district, l.block,
               r.reason as recommendation_reason, i.name as intervention_name
        FROM actions a
        JOIN localities l ON a.locality_id = l.id
        LEFT JOIN recommendations r ON a.recommendation_id = r.id
        LEFT JOIN interventions i ON r.intervention_id = i.id
        WHERE 1=1
    `;
    const params = [];

    if (locality_id) {
        sql += ' AND a.locality_id = ?';
        params.push(locality_id);
    }
    if (status) {
        sql += ' AND a.status = ?';
        params.push(status);
    }

    sql += ' ORDER BY a.deadline ASC';

    const nowIso = new Date().toISOString().split('T')[0];
    const actions = query(sql, params).map(a => {
        const isOverdue = a.status !== 'verified' && a.status !== 'closed' && a.deadline < nowIso;
        return {
            ...a,
            is_overdue: isOverdue ? 1 : 0
        };
    });

    res.json({ actions });
});

// POST /api/actions/approve-recommendation (Officer approves system recommendation into an official action)
router.post('/approve-recommendation', authenticateToken, requireRole(['officer', 'admin']), (req, res) => {
    const {
        recommendation_id,
        owner,
        budget,
        deadline,
        custom_title
    } = req.body;

    if (!recommendation_id || !owner || !budget || !deadline) {
        return res.status(400).json({ error: 'Missing required action approval fields: recommendation_id, owner, budget, deadline.' });
    }

    const rec = get(`
        SELECT r.*, i.name as intervention_name
        FROM recommendations r
        JOIN interventions i ON r.intervention_id = i.id
        WHERE r.id = ?
    `, [recommendation_id]);

    if (!rec) {
        return res.status(404).json({ error: 'Recommendation not found.' });
    }

    const actionId = `ACT-${uuidv4().substring(0, 8)}`;
    const title = custom_title || `${rec.intervention_name} Deployment`;

    transaction(() => {
        // 1. Mark recommendation as approved
        run(`
            UPDATE recommendations
            SET status = 'approved', approved_by = ?, officer_notes = ?
            WHERE id = ?
        `, [req.user.full_name, req.body.notes || 'Approved for ground deployment', recommendation_id]);

        // 2. Create the tracked action
        run(`
            INSERT INTO actions (
                id, recommendation_id, locality_id, sport, title,
                owner, budget, deadline, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [actionId, recommendation_id, rec.locality_id, rec.sport, title, owner, budget, deadline]);

        // 3. Audit log the decision
        recordAudit({
            userId: req.user.id,
            userRole: req.user.role,
            action: 'APPROVE_RECOMMENDATION_CREATE_ACTION',
            entityType: 'action',
            entityId: actionId,
            details: { recommendation_id, title, owner, budget, deadline },
            ipAddress: req.ip
        });
    });

    res.status(201).json({
        message: 'Recommendation approved and action plan created.',
        action_id: actionId,
        status: 'approved'
    });
});

// PUT /api/actions/:id/status (Advance action lifecycle: approved -> in_progress)
router.put('/:id/status', authenticateToken, requireRole(['officer', 'teacher_coach', 'admin']), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const action = get('SELECT * FROM actions WHERE id = ?', [id]);
    if (!action) {
        return res.status(404).json({ error: 'Action not found.' });
    }

    // Status transition rules
    const allowed = ['approved', 'in_progress', 'done', 'verified', 'closed'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Invalid status '${status}'. Must be one of [${allowed.join(', ')}]` });
    }

    if (status === 'done' && !action.proof_url && !req.body.proof_url) {
        return res.status(400).json({ error: "Cannot mark action as 'done' without providing proof upload." });
    }

    run(`
        UPDATE actions
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [status, id]);

    recordAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'UPDATE_ACTION_STATUS',
        entityType: 'action',
        entityId: id,
        details: { from: action.status, to: status },
        ipAddress: req.ip
    });

    res.json({ message: `Action status updated to '${status}'.`, id, status });
});

// POST /api/actions/:id/proof (Upload proof of completion: photo URL + timestamp + geo coordinates)
router.post('/:id/proof', authenticateToken, requireRole(['teacher_coach', 'officer', 'admin']), (req, res) => {
    const { id } = req.params;
    const { proof_url, proof_lat, proof_lon } = req.body;

    if (!proof_url) {
        return res.status(400).json({ error: 'Proof photo URL or evidence reference is required.' });
    }

    const action = get('SELECT * FROM actions WHERE id = ?', [id]);
    if (!action) {
        return res.status(404).json({ error: 'Action not found.' });
    }

    run(`
        UPDATE actions
        SET proof_url = ?,
            proof_timestamp = CURRENT_TIMESTAMP,
            proof_lat = ?,
            proof_lon = ?,
            status = 'done',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [proof_url, proof_lat || null, proof_lon || null, id]);

    recordAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'SUBMIT_ACTION_PROOF',
        entityType: 'action',
        entityId: id,
        details: { proof_url, proof_lat, proof_lon, new_status: 'done' },
        ipAddress: req.ip
    });

    res.json({
        message: "Proof submitted successfully. Action marked as 'done', awaiting second-officer verification.",
        id,
        status: 'done',
        proof_url
    });
});

// POST /api/actions/:id/verify (Second confirmer verification - enforces confirmer != owner)
router.post('/:id/verify', authenticateToken, requireRole(['officer', 'admin']), (req, res) => {
    const { id } = req.params;
    const action = get('SELECT * FROM actions WHERE id = ?', [id]);

    if (!action) {
        return res.status(404).json({ error: 'Action not found.' });
    }

    if (action.status !== 'done') {
        return res.status(400).json({ error: "Action must be in 'done' status with submitted proof before it can be verified." });
    }

    // Two-person rule enforcement: Verifier MUST be different from owner
    if (req.user.full_name === action.owner && req.user.role !== 'admin') {
        return res.status(403).json({
            error: `Two-person rule violation: Action owner '${action.owner}' cannot verify their own action. Verification must be performed by an independent second confirmer.`
        });
    }

    run(`
        UPDATE actions
        SET status = 'verified',
            second_confirmer = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [req.user.full_name, id]);

    recordAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'VERIFY_ACTION_SECOND_CONFIRMER',
        entityType: 'action',
        entityId: id,
        details: { second_confirmer: req.user.full_name, previous_status: action.status },
        ipAddress: req.ip
    });

    res.json({
        message: 'Action verified by second confirmer and closed.',
        id,
        status: 'verified',
        second_confirmer: req.user.full_name
    });
});

module.exports = router;
