/**
 * KheloDisha Recommendation Engine
 * Evidence-based intervention matching, precondition validation, and ROI ranking.
 */

const SEED_INTERVENTIONS = [
    {
        id: 'INT-COACHING',
        name: 'Subsidised Shared Coaching',
        barrier_addressed: ['cost', 'no_coach'],
        preconditions: 'Functional court with lighting or day-time access',
        fixed_cost: 90000,
        max_reach: 40,
        time_to_start: '2 weeks',
        description: 'Deploy qualified regional badminton coach for 3 sessions/week with subsidized player fees.'
    },
    {
        id: 'INT-HUB-TRANSPORT',
        name: 'Shared Hub Transport & Female Coach',
        barrier_addressed: ['distance', 'safety', 'no_coach'],
        preconditions: 'Designated safe pickup cluster points with parent chaperone',
        fixed_cost: 240000,
        max_reach: 50,
        time_to_start: '3 weeks',
        description: 'Dedicated electric van/bus route to central sports hub with certified female coach to ensure safety and boost girls participation.'
    },
    {
        id: 'INT-EQUIPMENT-KIT',
        name: 'Youth Badminton Equipment Kit',
        barrier_addressed: ['equipment'],
        preconditions: 'Secure lockable storage in village school or panchayat office',
        fixed_cost: 35000,
        max_reach: 60,
        time_to_start: '1 week',
        description: 'Provides 24 tournament grade rackets, 50 shuttle tubes, net post systems, and grip replacements.'
    },
    {
        id: 'INT-SHARED-GROUND',
        name: 'Shared School Ground Lighting & Access',
        barrier_addressed: ['no_ground'],
        preconditions: 'School ground within 3 km with formal MOU',
        fixed_cost: 50000,
        max_reach: 80,
        time_to_start: '2 weeks',
        description: 'Dual-use agreement with School and Mass Education Dept for evening court access with LED solar floodlights.'
    },
    {
        id: 'INT-VISITING-COACH',
        name: 'Visiting Roving Badminton Coach Circuit',
        barrier_addressed: ['no_coach'],
        preconditions: 'Basic court surface available',
        fixed_cost: 60000,
        max_reach: 50,
        time_to_start: '1 week',
        description: 'Certified coach visits 3 rural blocks on rotation twice weekly for structured drills.'
    }
];

/**
 * Checks whether preconditions for an intervention are met in a given locality context
 */
function verifyPreconditions(intervention, context) {
    if (!intervention.preconditions) return true;

    // Specific precondition checks
    if (intervention.id === 'INT-SHARED-GROUND') {
        // Requires school within 3 km
        return context.has_school_within_3km !== false;
    }

    return true;
}

/**
 * Generate and rank recommended interventions for a locality
 * @param {Object} localityData
 *   - gap_score: number
 *   - unserved_children: number
 *   - top_barriers: Array<{ category: string, count: number }>
 *   - context: Object (e.g. { has_school_within_3km: true })
 * @param {Array} catalog: Optional custom intervention list
 * @param {number} gapThreshold: Default 50
 */
function generateRecommendations(localityData, catalog = SEED_INTERVENTIONS, gapThreshold = 50.0) {
    const { gap_score, unserved_children, top_barriers = [], context = {} } = localityData;

    // Interventions only triggered if locality gap score is above threshold
    if (gap_score < gapThreshold) {
        return [];
    }

    const topTwoBarrierCategories = top_barriers.slice(0, 2).map(b => b.category);
    const unservedCount = Math.max(10, unserved_children || 40);

    const recommendations = [];

    for (const item of catalog) {
        // Address either of the top 2 barriers
        const addressesBarrier = item.barrier_addressed.some(b => topTwoBarrierCategories.includes(b));
        if (!addressesBarrier) continue;

        // Verify preconditions
        if (!verifyPreconditions(item, context)) continue;

        const expected_reach = Math.min(item.max_reach, unservedCount);
        const cost = item.fixed_cost;
        const cost_per_child = expected_reach > 0 ? Number((cost / expected_reach).toFixed(0)) : cost;
        const reach_per_rupee = cost > 0 ? expected_reach / cost : 0;

        // Compose explainable reason text
        const matchedBarriers = item.barrier_addressed.filter(b => topTwoBarrierCategories.includes(b));
        const barrierNames = matchedBarriers.join(' and ');
        const reason = `Directly addresses priority barrier (${barrierNames}) in this block. Designed to serve ${expected_reach} children at an assumed cost of ₹${cost_per_child}/child (${item.time_to_start} deployment).`;

        recommendations.push({
            intervention_id: item.id,
            name: item.name,
            barrier_addressed: item.barrier_addressed,
            matched_barriers: matchedBarriers,
            reason,
            expected_reach,
            cost,
            cost_per_child,
            reach_per_rupee,
            time_to_start: item.time_to_start,
            cost_label: 'Assumed cost (subject to local tender)',
            status: 'recommended'
        });
    }

    // Rank by children reached per rupee descending (highest efficiency first)
    recommendations.sort((a, b) => b.reach_per_rupee - a.reach_per_rupee);

    return recommendations;
}

module.exports = {
    SEED_INTERVENTIONS,
    verifyPreconditions,
    generateRecommendations
};
