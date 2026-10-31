const { get } = require('../db/database');

/**
 * Validates that a player under 18 has an active, granted parental consent record
 * before activation or permanent record storage.
 */
function verifyParentalConsent(req, res, next) {
    const { consent_id, player_pseudo_id, consent } = req.body;

    // If an inline consent is submitted during registration
    if (consent && consent.guardian_name && consent.guardian_contact && consent.status === 'granted') {
        req.hasInlineConsent = true;
        return next();
    }

    const cId = consent_id || req.body.consentId;
    const pPseudoId = player_pseudo_id || req.body.pseudo_id;

    if (!cId && !pPseudoId) {
        return res.status(400).json({
            error: 'Parental Consent Required: Cannot store or activate a child athlete under 18 without a verified parental consent record.',
            requires_consent: true
        });
    }

    // Look up consent in database
    let consentRecord = null;
    if (cId) {
        consentRecord = get('SELECT * FROM consents WHERE id = ?', [cId]);
    } else if (pPseudoId) {
        consentRecord = get('SELECT * FROM consents WHERE player_pseudo_id = ?', [pPseudoId]);
    }

    if (!consentRecord) {
        return res.status(403).json({
            error: 'Parental Consent Not Found: No guardian consent record exists for this child.',
            requires_consent: true
        });
    }

    if (consentRecord.status !== 'granted') {
        return res.status(403).json({
            error: `Parental Consent Inactive: Consent status is currently '${consentRecord.status}'. Activation blocked.`,
            consent_status: consentRecord.status,
            requires_consent: true
        });
    }

    req.verifiedConsent = consentRecord;
    next();
}

module.exports = {
    verifyParentalConsent
};
