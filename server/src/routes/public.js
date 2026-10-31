const express = require('express');
const router = express.Router();
const { query } = require('../db/database');
const { protectSmallGroup } = require('../middleware/privacy');

// GET /api/public/scorecard (Publicly accessible aggregated scorecard by block)
router.get('/scorecard', (req, res) => {
    const { district = 'Sundargarh', sport = 'badminton' } = req.query;

    const localities = query(`
        SELECT l.id, l.name, l.block, l.district, l.child_population,
               gs.score as gap_score, gs.confidence_label,
               gs.unserved_demand_pct, gs.access_gap_pct, gs.barrier_pressure_pct, gs.equity_gap_pct,
               gs.top_barriers_json
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
        WHERE l.district = ?
        ORDER BY gs.score DESC NULLS LAST
    `, [sport, district]);

    const scorecard = localities.map(loc => {
        // Fetch active player count to apply small group suppression (<10)
        const playerCountRow = query(`
            SELECT COUNT(*) as total_count,
                   SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as girls_count
            FROM players
            WHERE locality_id = ? AND is_active = 1
        `, [loc.id])[0];

        const totalPlayers = playerCountRow ? playerCountRow.total_count : 0;
        const girlsCount = playerCountRow ? playerCountRow.girls_count : 0;

        // Apply privacy guard
        const privacySafeParticipation = protectSmallGroup(totalPlayers, {
            total_active_athletes: totalPlayers,
            girls_count: girlsCount,
            girls_percentage: totalPlayers > 0 ? Math.round((girlsCount / totalPlayers) * 100) : 0
        });

        // Fetch completed actions in this locality
        const completedActions = query(`
            SELECT a.title, a.budget, a.status, a.updated_at
            FROM actions a
            WHERE a.locality_id = ? AND a.status IN ('done', 'verified', 'closed')
        `, [loc.id]);

        return {
            block: loc.block,
            locality_name: loc.name,
            district: loc.district,
            gap_score: loc.gap_score,
            confidence: loc.confidence_label || 'High',
            indicators: {
                unserved_demand_pct: loc.unserved_demand_pct ? Number(loc.unserved_demand_pct.toFixed(1)) : 0,
                access_gap_pct: loc.access_gap_pct ? Number(loc.access_gap_pct.toFixed(1)) : 0,
                barrier_pressure_pct: loc.barrier_pressure_pct ? Number(loc.barrier_pressure_pct.toFixed(1)) : 0,
                equity_gap_pct: loc.equity_gap_pct ? Number(loc.equity_gap_pct.toFixed(1)) : 0
            },
            top_barriers: loc.top_barriers_json ? JSON.parse(loc.top_barriers_json) : [],
            participation: privacySafeParticipation.suppressed ? {
                suppressed: true,
                message: 'Group too small to display'
            } : privacySafeParticipation.value,
            actions_completed: completedActions.length,
            is_simulated: true
        };
    });

    res.json({
        mission: 'Khelo India State Sports Decision Support Scorecard',
        district,
        sport,
        privacy_policy: 'Strictly aggregated statistics. Zero personally identifiable information is stored or exposed. Groups under 10 children are automatically suppressed.',
        blocks: scorecard
    });
});

module.exports = router;
