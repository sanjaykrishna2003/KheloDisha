const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, get, run } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLogger');

// GET /api/sponsors/matchmaking (Calculate match scores for CSR sponsors)
router.get('/matchmaking', (req, res) => {
    const { sponsor_id = 'SPN-TATA', sport = 'badminton' } = req.query;

    const sponsor = get('SELECT * FROM sponsors WHERE id = ?', [sponsor_id]);
    const focusSports = sponsor ? sponsor.focus_sports.split(',') : ['badminton'];
    const focusDistricts = sponsor ? sponsor.focus_districts.split(',') : ['Sundargarh'];

    // Get high need localities with gap scores
    const localities = query(`
        SELECT l.id, l.name, l.block, l.district, l.child_population,
               gs.score as gap_score, gs.unserved_demand_pct,
               COALESCE(SUM(f.amount), 0) as existing_funding
        FROM localities l
        JOIN gap_scores gs ON l.id = gs.locality_id
        LEFT JOIN funding f ON l.id = f.locality_id
        WHERE gs.sport = ?
        GROUP BY l.id
        ORDER BY gs.score DESC
    `, [sport]);

    const matches = localities.map(loc => {
        // 1. Fit score (50%): sport match + district match
        const sportFit = focusSports.includes(sport) ? 1.0 : 0.2;
        const districtFit = focusDistricts.includes(loc.district) ? 1.0 : 0.4;
        const fitScore = ((sportFit * 0.6) + (districtFit * 0.4)) * 100;

        // 2. Need score (50%): gap_score * unfunded share
        const estimatedBudgetCap = 250000;
        const unfundedShare = Math.max(0.1, 1 - (loc.existing_funding / estimatedBudgetCap));
        const needScore = Math.min(100, loc.gap_score * unfundedShare);

        // Combined score: 50% fit + 50% need
        const matchScore = Number(((0.50 * fitScore) + (0.50 * needScore)).toFixed(1));

        return {
            locality_id: loc.id,
            locality_name: loc.name,
            block: loc.block,
            district: loc.district,
            gap_score: loc.gap_score,
            unfunded_amount: Math.max(0, estimatedBudgetCap - loc.existing_funding),
            funding_cap: estimatedBudgetCap,
            fit_score: Number(fitScore.toFixed(1)),
            need_score: Number(needScore.toFixed(1)),
            match_score: matchScore,
            fit_reason: `High geographic fit with ${loc.district} district and badminton development priority.`
        };
    }).sort((a, b) => b.match_score - a.match_score);

    res.json({
        sponsor: sponsor || { name: 'Tata Steel Sports Foundation CSR', total_budget: 2500000, committed_budget: 480000 },
        matches,
        district_pool: {
            name: 'Sundargarh District Youth Sports Pool',
            unallocated_amount: 850000,
            purpose: 'General infrastructure pool for unmatched rural panchayats'
        }
    });
});

// POST /api/sponsors/fund (Pledge CSR sponsorship support)
router.post('/fund', authenticateToken, requireRole(['sponsor', 'admin']), (req, res) => {
    const { locality_id, action_id, amount, sponsor_id = 'SPN-TATA' } = req.body;

    if (!locality_id || !amount) {
        return res.status(400).json({ error: 'Locality and amount are required.' });
    }

    const fundId = `FND-${uuidv4().substring(0, 8)}`;
    const nowIso = new Date().toISOString().split('T')[0];

    run(`
        INSERT INTO funding (id, sponsor_id, locality_id, action_id, amount, status, date)
        VALUES (?, ?, ?, ?, ?, 'pledged', ?)
    `, [fundId, sponsor_id, locality_id, action_id || null, amount, nowIso]);

    recordAudit({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'PLEDGE_SPONSOR_FUNDING',
        entityType: 'funding',
        entityId: fundId,
        details: { locality_id, amount, sponsor_id },
        ipAddress: req.ip
    });

    res.status(201).json({
        message: 'Funding pledge registered successfully. Thank you for empowering rural youth athletics.',
        fund_id: fundId,
        amount
    });
});

module.exports = router;
