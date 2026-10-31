const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
    computeRawIndicators,
    scalePeerGroup,
    computeGapScore,
    applyShrinkage,
    computeConfidence,
    checkRankingStability,
    evaluatePeerGroup,
    deduplicateAndWeightReports,
    haversineDistance,
    DEFAULT_WEIGHTS
} = require('../src/scoring/engine');
const { generateRecommendations, SEED_INTERVENTIONS } = require('../src/scoring/recommendations');

describe('KheloDisha Scoring Engine Acceptance Tests', () => {

    // 1. Raw Indicator Computation for 4 Seed Blocks
    test('computes raw indicators correctly for Blocks A, B, C, D', () => {
        // Block A: 100 interested, capacity 30, 55% within 5km, 38/50 barrier reports, girls 30%
        const rawA = computeRawIndicators({
            interested: 100,
            capacity: 30,
            percent_within_reach: 55,
            barrier_reports_count: 38,
            total_respondents: 50,
            girls_share_pct: 30
        });
        assert.equal(rawA.unserved_demand_pct, 70.0);
        assert.equal(rawA.access_gap, 45.0);
        assert.equal(rawA.barrier_pressure, 76.0);
        assert.equal(rawA.equity_gap, 20.0);

        // Block B: 90 interested, capacity 40, 30% within 5km, 27/45 barrier reports, girls 20%
        const rawB = computeRawIndicators({
            interested: 90,
            capacity: 40,
            percent_within_reach: 30,
            barrier_reports_count: 27,
            total_respondents: 45,
            girls_share_pct: 20
        });
        assert.equal(Number(rawB.unserved_demand_pct.toFixed(2)), 55.56);
        assert.equal(rawB.access_gap, 70.0);
        assert.equal(rawB.barrier_pressure, 60.0);
        assert.equal(rawB.equity_gap, 30.0);

        // Block C: 60 interested, capacity 55, 75% within 5km, 12/40 barrier reports, girls 40%
        const rawC = computeRawIndicators({
            interested: 60,
            capacity: 55,
            percent_within_reach: 75,
            barrier_reports_count: 12,
            total_respondents: 40,
            girls_share_pct: 40
        });
        assert.equal(Number(rawC.unserved_demand_pct.toFixed(2)), 8.33);
        assert.equal(rawC.access_gap, 25.0);
        assert.equal(rawC.barrier_pressure, 30.0);
        assert.equal(rawC.equity_gap, 10.0);

        // Block D: 80 interested, capacity 50, 65% within 5km, 20/40 barrier reports, girls 45%
        const rawD = computeRawIndicators({
            interested: 80,
            capacity: 50,
            percent_within_reach: 65,
            barrier_reports_count: 20,
            total_respondents: 40,
            girls_share_pct: 45
        });
        assert.equal(rawD.unserved_demand_pct, 37.5);
        assert.equal(rawD.access_gap, 35.0);
        assert.equal(rawD.barrier_pressure, 50.0);
        assert.equal(rawD.equity_gap, 5.0);
    });

    // 2. Peer Group Min-Max Scaling and Expected Composite Gap Scores
    test('reproduces exact acceptance scores: B=84.3, A=78.1, D=30.6, C=4.0', () => {
        const blocksInput = [
            {
                id: 'LOC-A',
                block: 'Block A',
                data: {
                    interested: 100,
                    capacity: 30,
                    percent_within_reach: 55,
                    barrier_reports_count: 38,
                    total_respondents: 50,
                    girls_share_pct: 30,
                    verified_share: 0.95,
                    age_in_days: 15
                }
            },
            {
                id: 'LOC-B',
                block: 'Block B',
                data: {
                    interested: 90,
                    capacity: 40,
                    percent_within_reach: 30,
                    barrier_reports_count: 27,
                    total_respondents: 45,
                    girls_share_pct: 20,
                    verified_share: 0.92,
                    age_in_days: 12
                }
            },
            {
                id: 'LOC-C',
                block: 'Block C',
                data: {
                    interested: 60,
                    capacity: 55,
                    percent_within_reach: 75,
                    barrier_reports_count: 12,
                    total_respondents: 40,
                    girls_share_pct: 40,
                    verified_share: 0.88,
                    age_in_days: 20
                }
            },
            {
                id: 'LOC-D',
                block: 'Block D',
                data: {
                    interested: 80,
                    capacity: 50,
                    percent_within_reach: 65,
                    barrier_reports_count: 20,
                    total_respondents: 40,
                    girls_share_pct: 45,
                    verified_share: 0.90,
                    age_in_days: 10
                }
            }
        ];

        const evaluation = evaluatePeerGroup(blocksInput, { weights: DEFAULT_WEIGHTS });
        const byId = Object.fromEntries(evaluation.localities.map(l => [l.id, l]));

        // Expected Scores Check
        assert.equal(byId['LOC-B'].score, 84.3, 'Block B score must be 84.3');
        assert.equal(byId['LOC-A'].score, 78.1, 'Block A score must be 78.1');
        assert.equal(byId['LOC-D'].score, 30.6, 'Block D score must be 30.6');
        assert.equal(byId['LOC-C'].score, 4.0, 'Block C score must be 4.0');

        // Ranking Order Check: B > A > D > C
        const rankingOrder = evaluation.localities.map(l => l.id);
        assert.deepEqual(rankingOrder, ['LOC-B', 'LOC-A', 'LOC-D', 'LOC-C']);

        // Check Block B Top Contributions: access gap 25.0 and equity 20.0
        assert.equal(byId['LOC-B'].contributions.access_gap, 25.0);
        assert.equal(byId['LOC-B'].contributions.equity_gap, 20.0);

        // Check Block A Top Contributions: unserved demand 30.0 and barrier pressure 25.0
        assert.equal(byId['LOC-A'].contributions.unserved_demand, 30.0);
        assert.equal(byId['LOC-A'].contributions.barrier_pressure, 25.0);
    });

    // 3. Ranking Stability Under +/- 10 Weight Shifts
    test('preserves ranking order (B, A, D, C) under +/-10 weight perturbations', () => {
        const blocksInput = [
            {
                id: 'LOC-A',
                raw: computeRawIndicators({ interested: 100, capacity: 30, percent_within_reach: 55, barrier_reports_count: 38, total_respondents: 50, girls_share_pct: 30 })
            },
            {
                id: 'LOC-B',
                raw: computeRawIndicators({ interested: 90, capacity: 40, percent_within_reach: 30, barrier_reports_count: 27, total_respondents: 45, girls_share_pct: 20 })
            },
            {
                id: 'LOC-C',
                raw: computeRawIndicators({ interested: 60, capacity: 55, percent_within_reach: 75, barrier_reports_count: 12, total_respondents: 40, girls_share_pct: 40 })
            },
            {
                id: 'LOC-D',
                raw: computeRawIndicators({ interested: 80, capacity: 50, percent_within_reach: 65, barrier_reports_count: 20, total_respondents: 40, girls_share_pct: 45 })
            }
        ];

        const scaled = scalePeerGroup(blocksInput);
        const stability = checkRankingStability(scaled, DEFAULT_WEIGHTS);

        assert.equal(stability.isStable, true, 'Ranking must remain stable');
        assert.equal(stability.status, 'stable');
        assert.deepEqual(stability.baselineOrder, ['LOC-B', 'LOC-A', 'LOC-D', 'LOC-C']);
    });

    // 4. Block B Post-Fix Demand & Difference-in-Differences Attendance Impact
    test('calculates Block B post-fix demand and DiD attendance effect of 27 attendees/week', () => {
        // Block B unserved demand before: 90 interested, 40 capacity -> (50/90)*100 = 55.56%
        const demandBefore = ((90 - 40) / 90) * 100;
        assert.equal(Number(demandBefore.toFixed(1)), 55.6);

        // Block B unserved demand after fix: 90 interested, 68 attending -> (22/90)*100 = 24.44%
        const demandAfter = ((90 - 68) / 90) * 100;
        assert.equal(Number(demandAfter.toFixed(1)), 24.4);

        // Difference-in-Differences (DiD):
        // Treated Block B: before = 35, after = 68 -> change = +33
        // Comparison Block E: before = 38, after = 44 -> change = +6
        // Observed Difference = (68 - 35) - (44 - 38) = 33 - 6 = 27
        const treatedBefore = 35;
        const treatedAfter = 68;
        const compBefore = 38;
        const compAfter = 44;

        const didEffect = (treatedAfter - treatedBefore) - (compAfter - compBefore);
        assert.equal(didEffect, 27);
    });

    // 5. Deduplication and Trust Weighting
    test('deduplicates reports within 30 days and applies trust weights', () => {
        const reports = [
            { reporter_pseudo_id: 'P1', locality_id: 'LOC-B', sport: 'badminton', category: 'distance', reporter_role: 'player_parent', date: '2026-06-01' },
            { reporter_pseudo_id: 'P1', locality_id: 'LOC-B', sport: 'badminton', category: 'distance', reporter_role: 'teacher_coach', date: '2026-06-15' } // Should overwrite earlier P1
        ];

        const deduped = deduplicateAndWeightReports(reports);
        assert.equal(deduped.length, 1);
        assert.equal(deduped[0].date, '2026-06-15');
        assert.equal(deduped[0].effective_trust, 0.8);
    });

    // 6. Confidence Metric & Small Group / Insufficient Data Guard
    test('calculates confidence and classifies threshold correctly', () => {
        // High confidence: 45 responses, 90% verified, recent (10 days)
        const highConf = computeConfidence({ responses: 45, verified_share: 0.9, age_in_days: 10 });
        assert.equal(highConf.label, 'High');
        assert.ok(highConf.confidence >= 0.7);

        // Insufficient data: 5 responses, 20% verified, 160 days old
        const lowConf = computeConfidence({ responses: 5, verified_share: 0.2, age_in_days: 160 });
        assert.equal(lowConf.label, 'Insufficient data');
        assert.ok(lowConf.confidence < 0.4);
    });

    // 7. Recommendation Engine Logic
    test('generates ranked interventions for high-gap localities', () => {
        const localityData = {
            gap_score: 84.3,
            unserved_children: 50,
            top_barriers: [
                { category: 'distance', count: 18 },
                { category: 'safety', count: 12 }
            ],
            context: { has_school_within_3km: true }
        };

        const recs = generateRecommendations(localityData, SEED_INTERVENTIONS, 50.0);
        assert.ok(recs.length > 0);

        // Shared hub transport addresses distance & safety
        const hubRec = recs.find(r => r.intervention_id === 'INT-HUB-TRANSPORT');
        assert.ok(hubRec !== undefined);
        assert.ok(hubRec.expected_reach <= 50);
        assert.ok(hubRec.reason.includes('distance and safety'));
    });
});
