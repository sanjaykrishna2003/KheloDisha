/**
 * KheloDisha Scoring Engine
 * Pure mathematical functions for sports opportunity gap analysis.
 * Independent of database, web server, and UI framework.
 */

/**
 * Trust weights assigned by reporter verification tier
 */
const TRUST_WEIGHTS = {
    self_reported: 0.5,
    player_parent: 0.5,
    teacher_coach: 0.8,
    teacher_confirmed: 0.8,
    officer: 1.0,
    officer_verified: 1.0
};

/**
 * Default indicator weights for gap score calculation
 */
const DEFAULT_WEIGHTS = {
    unserved_demand: 0.30,
    access_gap: 0.25,
    barrier_pressure: 0.25,
    equity_gap: 0.20
};

/**
 * Great-circle distance between two coordinates in kilometers (Haversine formula)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * 1. Deduplicate barrier reports
 * Rule: same pseudonymous reporter + locality + sport + category within 30 days keeps the latest.
 * Applies trust weighting to deduplicated reports.
 */
function deduplicateAndWeightReports(reports) {
    if (!reports || reports.length === 0) return [];

    // Sort by date ascending so latest overwrites earlier
    const sorted = [...reports].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dedupedMap = new Map();

    for (const report of sorted) {
        const key = `${report.reporter_pseudo_id}_${report.locality_id}_${report.sport}_${report.category}`;
        const existing = dedupedMap.get(key);
        if (!existing) {
            dedupedMap.set(key, report);
        } else {
            const daysDiff = (new Date(report.date) - new Date(existing.date)) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 30) {
                dedupedMap.set(key, report); // Keep latest
            } else {
                // Beyond 30 days, treat as distinct recurring report
                dedupedMap.set(`${key}_${report.date}`, report);
            }
        }
    }

    return Array.from(dedupedMap.values()).map(r => {
        const trust = r.trust_level !== undefined ? r.trust_level : (TRUST_WEIGHTS[r.reporter_role] || 0.5);
        return {
            ...r,
            effective_trust: trust
        };
    });
}

/**
 * 2. Compute raw indicators for a locality:
 * - unserved_demand_pct = max(0, interested - capacity) / interested * 100
 * - access_gap = 100 - (percent of children within reach of usable facility)
 * - barrier_pressure = trust-weighted percent of respondents reporting any barrier
 * - equity_gap = 50 - girls_share_of_regular_players (percentage points)
 */
function computeRawIndicators({
    interested,
    capacity,
    percent_within_reach,
    barrier_reports_count,
    total_respondents,
    trust_weighted_barrier_sum,
    trust_weighted_respondent_sum,
    girls_share_pct
}) {
    // Unserved demand %
    const unserved_demand_pct = interested > 0
        ? Math.max(0, (interested - capacity)) / interested * 100
        : 0;

    // Access gap %
    const access_gap = 100 - (percent_within_reach !== undefined ? percent_within_reach : 0);

    // Barrier pressure %
    let barrier_pressure = 0;
    if (trust_weighted_barrier_sum !== undefined && trust_weighted_respondent_sum !== undefined) {
        barrier_pressure = trust_weighted_respondent_sum > 0
            ? (trust_weighted_barrier_sum / trust_weighted_respondent_sum) * 100
            : 0;
    } else if (total_respondents > 0) {
        barrier_pressure = (barrier_reports_count / total_respondents) * 100;
    }

    // Equity gap (percentage points from 50% parity)
    const equity_gap = 50 - (girls_share_pct !== undefined ? girls_share_pct : 0);

    return {
        unserved_demand_pct: Number(unserved_demand_pct.toFixed(6)),
        access_gap: Number(access_gap.toFixed(6)),
        barrier_pressure: Number(barrier_pressure.toFixed(6)),
        equity_gap: Number(equity_gap.toFixed(6))
    };
}

/**
 * 3. Min-Max Scale indicators within a peer group (0 to 100)
 * lowest = 0, highest = 100
 * If min === max, scales to 0 to avoid division by zero.
 */
function minMaxScale(value, min, max) {
    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
}

/**
 * Scale indicators across a peer group array of localities
 */
function scalePeerGroup(localitiesData) {
    if (!localitiesData || localitiesData.length === 0) return [];

    const keys = ['unserved_demand_pct', 'access_gap', 'barrier_pressure', 'equity_gap'];
    const minMax = {};

    for (const key of keys) {
        const values = localitiesData.map(d => d.raw[key]);
        minMax[key] = {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    return localitiesData.map(item => {
        const scaled = {
            scaled_unserved_demand: minMaxScale(item.raw.unserved_demand_pct, minMax.unserved_demand_pct.min, minMax.unserved_demand_pct.max),
            scaled_access_gap: minMaxScale(item.raw.access_gap, minMax.access_gap.min, minMax.access_gap.max),
            scaled_barrier_pressure: minMaxScale(item.raw.barrier_pressure, minMax.barrier_pressure.min, minMax.barrier_pressure.max),
            scaled_equity_gap: minMaxScale(item.raw.equity_gap, minMax.equity_gap.min, minMax.equity_gap.max)
        };

        return {
            ...item,
            scaled,
            minMax
        };
    });
}

/**
 * 4. Compute composite gap score with weighted contributions
 */
function computeGapScore(scaled, weights = DEFAULT_WEIGHTS) {
    const contribDemand = scaled.scaled_unserved_demand * weights.unserved_demand;
    const contribAccess = scaled.scaled_access_gap * weights.access_gap;
    const contribBarrier = scaled.scaled_barrier_pressure * weights.barrier_pressure;
    const contribEquity = scaled.scaled_equity_gap * weights.equity_gap;

    const totalScore = contribDemand + contribAccess + contribBarrier + contribEquity;

    return {
        score: Number(totalScore.toFixed(1)),
        raw_score: totalScore,
        contributions: {
            unserved_demand: Number(contribDemand.toFixed(1)),
            access_gap: Number(contribAccess.toFixed(1)),
            barrier_pressure: Number(contribBarrier.toFixed(1)),
            equity_gap: Number(contribEquity.toFixed(1))
        }
    };
}

/**
 * 5. Optional shrinkage toward peer-group average for thin samples
 * adjusted = (n * observed + k * peer_avg) / (n + k), k = 10
 */
function applyShrinkage(observed, peer_avg, n, k = 10) {
    if (!n || n <= 0) return peer_avg;
    return (n * observed + k * peer_avg) / (n + k);
}

/**
 * 6. Confidence metric
 * Confidence = 0.4 * min(1, responses / 40) + 0.4 * verified_share + 0.2 * recency_factor
 * - High: >= 0.7
 * - Medium: 0.4 to 0.7
 * - Low / Insufficient: < 0.4 -> Show "Insufficient data"
 */
function computeConfidence({ responses = 0, verified_share = 0, age_in_days = 0 }) {
    const sampleFactor = Math.min(1.0, responses / 40.0);
    const verifiedFactor = Math.min(1.0, Math.max(0.0, verified_share));

    let recencyFactor = 1.0;
    if (age_in_days > 30) {
        recencyFactor = Math.max(0.0, 1.0 - ((age_in_days - 30) / 150.0));
    }

    const confidenceValue = (0.4 * sampleFactor) + (0.4 * verifiedFactor) + (0.2 * recencyFactor);
    const scoreVal = Number(confidenceValue.toFixed(2));

    let label = 'Insufficient data';
    if (scoreVal >= 0.7) {
        label = 'High';
    } else if (scoreVal >= 0.4) {
        label = 'Medium';
    }

    return {
        confidence: scoreVal,
        label,
        factors: {
            sampleFactor: Number(sampleFactor.toFixed(2)),
            verifiedFactor: Number(verifiedFactor.toFixed(2)),
            recencyFactor: Number(recencyFactor.toFixed(2))
        }
    };
}

/**
 * 7. Stability check: recompute rankings with weights shifted by +/- 10%
 * Check if the relative ranking order of localities is preserved.
 */
function checkRankingStability(scaledLocalities, baseWeights = DEFAULT_WEIGHTS) {
    const keys = Object.keys(baseWeights);

    // Get baseline ranking
    const baselineRanked = [...scaledLocalities]
        .map(loc => ({
            id: loc.id,
            score: computeGapScore(loc.scaled, baseWeights).score
        }))
        .sort((a, b) => b.score - a.score)
        .map(x => x.id);

    let isStable = true;
    const perturbations = [-0.10, 0.10]; // +/- 10% shift

    for (const key of keys) {
        for (const factor of [0.90, 1.10]) {
            const testWeights = { ...baseWeights };
            testWeights[key] = testWeights[key] * factor;

            // Re-normalize remaining weights so sum equals 1.0
            const otherKeys = keys.filter(k => k !== key);
            const otherSum = otherKeys.reduce((acc, k) => acc + baseWeights[k], 0);
            const remainingBudget = 1.0 - testWeights[key];

            for (const ok of otherKeys) {
                testWeights[ok] = (baseWeights[ok] / otherSum) * remainingBudget;
            }

            const testRanked = [...scaledLocalities]
                .map(loc => ({
                    id: loc.id,
                    score: computeGapScore(loc.scaled, testWeights).score
                }))
                .sort((a, b) => b.score - a.score)
                .map(x => x.id);

            const matches = baselineRanked.every((id, idx) => id === testRanked[idx]);
            if (!matches) {
                isStable = false;
                break;
            }
        }
        if (!isStable) break;
    }

    return {
        isStable,
        status: isStable ? 'stable' : 'sensitive',
        baselineOrder: baselineRanked
    };
}

/**
 * Complete evaluation function for a peer group of localities
 */
function evaluatePeerGroup(localitiesInput, options = {}) {
    const weights = options.weights || DEFAULT_WEIGHTS;
    const enableShrinkage = options.enableShrinkage || false;

    // 1. Compute raw indicators for each locality
    const withRaw = localitiesInput.map(loc => ({
        ...loc,
        raw: computeRawIndicators(loc.data)
    }));

    // 2. Min-Max scale within peer group
    const withScaled = scalePeerGroup(withRaw);

    // 3. Optional shrinkage if enabled
    if (enableShrinkage) {
        const peerAvg = withScaled.reduce((acc, item) => acc + computeGapScore(item.scaled, weights).score, 0) / withScaled.length;
        for (const item of withScaled) {
            const baseScore = computeGapScore(item.scaled, weights).score;
            const n = item.data.total_respondents || item.data.interested || 20;
            item.shrunkScore = Number(applyShrinkage(baseScore, peerAvg, n, 10).toFixed(1));
        }
    }

    // 4. Compute composite gap score, contributions, and confidence
    const evaluated = withScaled.map(item => {
        const gapResult = computeGapScore(item.scaled, weights);
        const conf = computeConfidence({
            responses: item.data.total_respondents || item.data.barrier_reports_count || 0,
            verified_share: item.data.verified_share !== undefined ? item.data.verified_share : 1.0,
            age_in_days: item.data.age_in_days !== undefined ? item.data.age_in_days : 15
        });

        return {
            id: item.id,
            name: item.name,
            block: item.block,
            sport: item.sport || 'badminton',
            raw: item.raw,
            scaled: item.scaled,
            score: gapResult.score,
            contributions: gapResult.contributions,
            confidence: conf.confidence,
            confidence_label: conf.label,
            top_barriers: item.top_barriers || []
        };
    });

    // 5. Check ranking stability
    const stability = checkRankingStability(withScaled, weights);

    return {
        localities: evaluated.sort((a, b) => b.score - a.score),
        stability,
        weights
    };
}

module.exports = {
    TRUST_WEIGHTS,
    DEFAULT_WEIGHTS,
    haversineDistance,
    deduplicateAndWeightReports,
    computeRawIndicators,
    minMaxScale,
    scalePeerGroup,
    computeGapScore,
    applyShrinkage,
    computeConfidence,
    checkRankingStability,
    evaluatePeerGroup
};
