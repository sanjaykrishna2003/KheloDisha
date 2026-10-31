/**
 * Privacy & Safety Utilities
 * Mandatory privacy protections for children's sports data in KheloDisha.
 */

const MIN_GROUP_SIZE = 10;

/**
 * Suppresses statistical metrics if sample size is below the privacy threshold (10)
 * @param {number} count Number of children in the group
 * @param {any} value Statistical value to protect
 * @returns {Object} Safe representation
 */
function protectSmallGroup(count, value) {
    if (count < MIN_GROUP_SIZE) {
        return {
            suppressed: true,
            sample_size: count,
            message: 'Group too small to display (privacy protected, min 10 required)',
            display_value: '—'
        };
    }

    return {
        suppressed: false,
        sample_size: count,
        value,
        display_value: value
    };
}

/**
 * Strips PII from player objects for non-guardian roles.
 * Converts to pure pseudonymized records.
 */
function pseudonymizePlayerRecord(player, requestingUser) {
    if (!player) return null;

    // Guardian or the player user themselves can see their own full details
    if (requestingUser && (requestingUser.id === player.user_id || requestingUser.role === 'admin')) {
        return {
            ...player,
            is_self: true
        };
    }

    // For all other roles (officers, sponsors, public, teachers):
    // Only return pseudonymous ID, age band, gender, sport, locality. Zero personal identifiers.
    return {
        id: player.pseudo_id,
        pseudo_id: player.pseudo_id,
        age_band: player.age_band,
        gender: player.gender,
        school: player.school,
        locality_id: player.locality_id,
        sport_interest: player.sport_interest,
        is_active: player.is_active,
        is_pseudonymized: true
    };
}

module.exports = {
    MIN_GROUP_SIZE,
    protectSmallGroup,
    pseudonymizePlayerRecord
};
