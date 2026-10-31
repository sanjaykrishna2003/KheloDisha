const express = require('express');
const router = express.Router();
const { query, get } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/alerts/early-warning (Identify blocks or groups with >25% attendance drops over 2 consecutive weeks)
router.get('/early-warning', (req, res) => {
    const { sport = 'badminton' } = req.query;

    const localities = query('SELECT * FROM localities');
    const alerts = [];

    for (const loc of localities) {
        // Fetch last 6 attendance sessions
        const sessions = query(`
            SELECT date, attendee_count, girls_count
            FROM sessions_attendance
            WHERE locality_id = ? AND sport = ?
            ORDER BY date DESC
            LIMIT 6
        `, [loc.id, sport]);

        if (sessions.length >= 4) {
            // Compute 4-week historical baseline
            const historical = sessions.slice(2);
            const baselineAvg = historical.reduce((acc, s) => acc + s.attendee_count, 0) / historical.length;

            const w1 = sessions[0].attendee_count;
            const w2 = sessions[1].attendee_count;

            const drop1 = (baselineAvg - w1) / baselineAvg;
            const drop2 = (baselineAvg - w2) / baselineAvg;

            // Check if drop is > 25% (0.25) for two consecutive weeks
            if (drop1 > 0.25 && drop2 > 0.25) {
                // Find top reported barrier in recent 30 days
                const topBarrier = get(`
                    SELECT category, COUNT(*) as cnt
                    FROM barrier_reports
                    WHERE locality_id = ? AND sport = ?
                    GROUP BY category
                    ORDER BY cnt DESC LIMIT 1
                `, [loc.id, sport]);

                const category = topBarrier ? topBarrier.category : 'no_coach';

                let suggestedFix = 'Deploy roving visiting coach circuit.';
                if (category === 'cost') suggestedFix = 'Provide equipment fee subsidy waiver.';
                else if (category === 'distance' || category === 'safety') suggestedFix = 'Activate shared hub van transport with female coach chaperone.';
                else if (category === 'exams') suggestedFix = 'Schedule flexible weekend morning sessions around academic exam dates.';

                alerts.push({
                    locality_id: loc.id,
                    locality_name: loc.name,
                    block: loc.block,
                    severity: 'critical',
                    drop_percentage: Math.round(Math.max(drop1, drop2) * 100),
                    baseline_average: Math.round(baselineAvg),
                    recent_attendance: [w2, w1],
                    top_barrier_cause: category,
                    suggested_action: suggestedFix,
                    rule_triggered: 'Weekly attendance > 25% below 4-week average for 2 consecutive weeks'
                });
            }
        }
    }

    res.json({
        total_alerts: alerts.length,
        alerts
    });
});

module.exports = router;
