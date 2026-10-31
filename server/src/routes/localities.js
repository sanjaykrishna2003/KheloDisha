const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { computeAndStoreScores } = require('../db/computeAndStoreScores');
const { evaluatePeerGroup, DEFAULT_WEIGHTS } = require('../scoring/engine');
const { recordAudit } = require('../middleware/auditLogger');

// GET /api/localities (List all localities with gap scores and peer ranking)
router.get('/', (req, res) => {
    const { district, sport = 'badminton' } = req.query;

    let sql = `
        SELECT l.*,
               gs.score as gap_score,
               gs.unserved_demand_pct,
               gs.access_gap_pct,
               gs.barrier_pressure_pct,
               gs.equity_gap_pct,
               gs.scaled_unserved_demand,
               gs.scaled_access_gap,
               gs.scaled_barrier_pressure,
               gs.scaled_equity_gap,
               gs.contributions_json,
               gs.top_barriers_json,
               gs.confidence,
               gs.confidence_label,
               gs.stability_status
        FROM localities l
        LEFT JOIN (
            SELECT * FROM gap_scores
            WHERE (locality_id, date) IN (
                SELECT locality_id, MAX(date)
                FROM gap_scores
                WHERE sport = ?
                GROUP BY locality_id
            )
        ) gs ON l.id = gs.locality_id
    `;
    const params = [sport];

    if (district) {
        sql += ` WHERE l.district = ?`;
        params.push(district);
    }

    sql += ` ORDER BY gs.score DESC NULLS LAST`;

    const localities = query(sql, params).map(loc => ({
        ...loc,
        contributions: loc.contributions_json ? JSON.parse(loc.contributions_json) : null,
        top_barriers: loc.top_barriers_json ? JSON.parse(loc.top_barriers_json) : [],
        is_simulated: Boolean(loc.is_simulated)
    }));

    res.json({ localities });
});

// GET /api/localities/:id (Detailed locality profile with facilities, barriers, and recommendations)
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const { sport = 'badminton' } = req.query;

    const locality = get('SELECT * FROM localities WHERE id = ?', [id]);
    if (!locality) {
        return res.status(404).json({ error: 'Locality not found.' });
    }

    // Get latest gap score
    const gapScore = get(`
        SELECT * FROM gap_scores
        WHERE locality_id = ? AND sport = ?
        ORDER BY date DESC LIMIT 1
    `, [id, sport]);

    // Get facilities in this locality
    const facilities = query(`
        SELECT * FROM facilities
        WHERE locality_id = ?
    `, [id]);

    // Get barrier reports summary
    const barrierSummary = query(`
        SELECT category, COUNT(*) as report_count,
               AVG(trust_level) as avg_trust,
               SUM(CASE WHEN status = 'teacher_confirmed' THEN 1 ELSE 0 END) as confirmed_count
        FROM barrier_reports
        WHERE locality_id = ? AND sport = ?
        GROUP BY category
        ORDER BY report_count DESC
    `, [id, sport]);

    // Get recommendations
    const recommendations = query(`
        SELECT r.*, i.name as intervention_name, i.description as intervention_description,
               i.preconditions, i.time_to_start
        FROM recommendations r
        JOIN interventions i ON r.intervention_id = i.id
        WHERE r.locality_id = ? AND r.sport = ?
        ORDER BY r.reach_per_rupee DESC
    `, [id, sport]);

    // Get attendance trends (last 8 weeks)
    const attendanceHistory = query(`
        SELECT date, attendee_count, girls_count
        FROM sessions_attendance
        WHERE locality_id = ? AND sport = ?
        ORDER BY date ASC
    `, [id, sport]);

    res.json({
        locality: {
            ...locality,
            is_simulated: Boolean(locality.is_simulated)
        },
        gap_score: gapScore ? {
            ...gapScore,
            contributions: JSON.parse(gapScore.contributions_json),
            top_barriers: JSON.parse(gapScore.top_barriers_json),
            weights: JSON.parse(gapScore.weights_json)
        } : null,
        facilities,
        barrier_summary: barrierSummary,
        recommendations,
        attendance_history: attendanceHistory
    });
});

// POST /api/localities/recompute-scores (Officer adjusting indicator weights and evaluating sensitivity)
router.post('/recompute-scores', authenticateToken, requireRole(['officer', 'admin']), (req, res) => {
    const { weights, sport = 'badminton' } = req.body;

    const customWeights = {
        unserved_demand: Number(weights?.unserved_demand ?? DEFAULT_WEIGHTS.unserved_demand),
        access_gap: Number(weights?.access_gap ?? DEFAULT_WEIGHTS.access_gap),
        barrier_pressure: Number(weights?.barrier_pressure ?? DEFAULT_WEIGHTS.barrier_pressure),
        equity_gap: Number(weights?.equity_gap ?? DEFAULT_WEIGHTS.equity_gap)
    };

    // Normalize weights if sum != 1.0
    const totalW = customWeights.unserved_demand + customWeights.access_gap + customWeights.barrier_pressure + customWeights.equity_gap;
    if (totalW > 0 && Math.abs(totalW - 1.0) > 0.001) {
        customWeights.unserved_demand = Number((customWeights.unserved_demand / totalW).toFixed(4));
        customWeights.access_gap = Number((customWeights.access_gap / totalW).toFixed(4));
        customWeights.barrier_pressure = Number((customWeights.barrier_pressure / totalW).toFixed(4));
        customWeights.equity_gap = Number((customWeights.equity_gap / totalW).toFixed(4));
    }

    try {
        const result = computeAndStoreScores(customWeights);

        recordAudit({
            userId: req.user.id,
            userRole: req.user.role,
            action: 'RECOMPUTE_GAP_SCORES',
            entityType: 'gap_scores',
            entityId: sport,
            details: { customWeights, stability: result.stability.status },
            ipAddress: req.ip
        });

        res.json({
            message: 'Gap scores and recommendations successfully recomputed with updated weights.',
            weights: customWeights,
            stability: result.stability,
            localities: result.localities
        });
    } catch (err) {
        console.error('Recomputation failed:', err);
        res.status(500).json({ error: 'Failed to recompute scores.' });
    }
});

module.exports = router;
