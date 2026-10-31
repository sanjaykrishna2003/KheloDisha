/**
 * Runs the scoring engine against current database state and updates gap_scores & recommendations tables
 */
const { query, run, transaction } = require('./database');
const { evaluatePeerGroup, DEFAULT_WEIGHTS } = require('../scoring/engine');
const { generateRecommendations, SEED_INTERVENTIONS } = require('../scoring/recommendations');

function computeAndStoreScores(customWeights = DEFAULT_WEIGHTS) {
    // 1. Fetch all localities in rural plains peer group
    const localities = query("SELECT * FROM localities WHERE peer_group = 'rural_plains_low_income'");

    // 2. Fetch ground statistics for badminton per locality
    // Demo data parameters
    const demoParams = {
        'LOC-BLOCK-A': { interested: 100, capacity: 30, reach_pct: 55, barrier_reports: 38, respondents: 50, girls_pct: 30, primary: 'no_ground', secondary: 'overcrowding' },
        'LOC-BLOCK-B': { interested: 90, capacity: 40, reach_pct: 30, barrier_reports: 27, respondents: 45, girls_pct: 20, primary: 'distance', secondary: 'safety' },
        'LOC-BLOCK-C': { interested: 60, capacity: 55, reach_pct: 75, barrier_reports: 12, respondents: 40, girls_pct: 40, primary: 'exams', secondary: 'awareness' },
        'LOC-BLOCK-D': { interested: 80, capacity: 50, reach_pct: 65, barrier_reports: 20, respondents: 40, girls_pct: 45, primary: 'cost', secondary: 'equipment' },
        'LOC-BLOCK-E': { interested: 85, capacity: 40, reach_pct: 60, barrier_reports: 22, respondents: 42, girls_pct: 42, primary: 'distance', secondary: 'cost' }
    };

    // Filter to the 4 main evaluation blocks
    const targetLocIds = ['LOC-BLOCK-A', 'LOC-BLOCK-B', 'LOC-BLOCK-C', 'LOC-BLOCK-D'];
    const targetLocs = localities.filter(l => targetLocIds.includes(l.id));

    const scoringInput = targetLocs.map(loc => {
        const p = demoParams[loc.id] || { interested: 80, capacity: 40, reach_pct: 50, barrier_reports: 20, respondents: 40, girls_pct: 30 };
        return {
            id: loc.id,
            name: loc.name,
            block: loc.block,
            sport: 'badminton',
            top_barriers: [
                { category: p.primary, count: Math.round(p.barrier_reports * 0.6) },
                { category: p.secondary, count: Math.round(p.barrier_reports * 0.4) }
            ],
            data: {
                interested: p.interested,
                capacity: p.capacity,
                percent_within_reach: p.reach_pct,
                barrier_reports_count: p.barrier_reports,
                total_respondents: p.respondents,
                girls_share_pct: p.girls_pct,
                verified_share: 0.92,
                age_in_days: 12
            }
        };
    });

    const evaluated = evaluatePeerGroup(scoringInput, { weights: customWeights });
    const nowIso = new Date().toISOString().split('T')[0];

    transaction(() => {
        // Clear previous unlinked recommendations and previous scores for simulated blocks
        run(`
            DELETE FROM recommendations 
            WHERE locality_id IN ('LOC-BLOCK-A', 'LOC-BLOCK-B', 'LOC-BLOCK-C', 'LOC-BLOCK-D')
            AND id NOT IN (SELECT recommendation_id FROM actions WHERE recommendation_id IS NOT NULL)
        `);
        run("DELETE FROM gap_scores WHERE locality_id IN ('LOC-BLOCK-A', 'LOC-BLOCK-B', 'LOC-BLOCK-C', 'LOC-BLOCK-D')");

        for (const loc of evaluated.localities) {
            // Save gap score
            run(`
                INSERT OR REPLACE INTO gap_scores (
                    id, locality_id, sport, date, score,
                    unserved_demand_pct, access_gap_pct, barrier_pressure_pct, equity_gap_pct,
                    scaled_unserved_demand, scaled_access_gap, scaled_barrier_pressure, scaled_equity_gap,
                    contributions_json, top_barriers_json, confidence, confidence_label,
                    stability_status, weights_json, is_simulated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [
                `GAP-${loc.id}-${nowIso}`,
                loc.id,
                loc.sport,
                nowIso,
                loc.score,
                loc.raw.unserved_demand_pct,
                loc.raw.access_gap,
                loc.raw.barrier_pressure,
                loc.raw.equity_gap,
                loc.scaled.scaled_unserved_demand,
                loc.scaled.scaled_access_gap,
                loc.scaled.scaled_barrier_pressure,
                loc.scaled.scaled_equity_gap,
                JSON.stringify(loc.contributions),
                JSON.stringify(loc.top_barriers),
                loc.confidence,
                loc.confidence_label,
                evaluated.stability.status,
                JSON.stringify(customWeights)
            ]);

            // Generate recommendations if above gap threshold 50.0
            const recs = generateRecommendations({
                gap_score: loc.score,
                unserved_children: Math.round(loc.raw.unserved_demand_pct * 0.9), // approximate unserved
                top_barriers: loc.top_barriers,
                context: { has_school_within_3km: true }
            }, SEED_INTERVENTIONS, 50.0);

            for (const r of recs) {
                run(`
                    INSERT INTO recommendations (
                        id, locality_id, sport, intervention_id, reason,
                        expected_reach, cost, cost_per_child, reach_per_rupee, status
                    ) VALUES (?, ?, 'badminton', ?, ?, ?, ?, ?, ?, 'recommended')
                    ON CONFLICT(id) DO UPDATE SET
                        reason = excluded.reason,
                        expected_reach = excluded.expected_reach,
                        cost = excluded.cost,
                        cost_per_child = excluded.cost_per_child,
                        reach_per_rupee = excluded.reach_per_rupee
                `, [
                    `REC-${loc.id}-${r.intervention_id}`,
                    loc.id,
                    r.intervention_id,
                    r.reason,
                    r.expected_reach,
                    r.cost,
                    r.cost_per_child,
                    r.reach_per_rupee
                ]);
            }
        }
    });

    console.log(`Computed and stored gap scores and recommendations for ${evaluated.localities.length} blocks.`);
    return evaluated;
}

if (require.main === module) {
    computeAndStoreScores();
}

module.exports = { computeAndStoreScores };
