const { run } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper to record an audit log entry
 */
function recordAudit({ userId, userRole, action, entityType, entityId, details, ipAddress }) {
    try {
        const id = `AUD-${uuidv4().substring(0, 8)}`;
        run(`
            INSERT INTO audit_log (id, user_id, user_role, action, entity_type, entity_id, details, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            id,
            userId || 'SYSTEM',
            userRole || 'anonymous',
            action,
            entityType,
            entityId || null,
            typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
            ipAddress || '127.0.0.1'
        ]);
        return id;
    } catch (err) {
        console.error('Failed to write audit log:', err);
    }
}

/**
 * Express middleware to automatically log mutating requests (POST, PUT, PATCH, DELETE)
 */
function auditMiddleware(entityType) {
    return (req, res, next) => {
        // Intercept finish event to log status
        res.on('finish', () => {
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400) {
                recordAudit({
                    userId: req.user ? req.user.id : null,
                    userRole: req.user ? req.user.role : 'anonymous',
                    action: `${req.method}_${req.baseUrl}${req.path}`,
                    entityType: entityType || 'api_resource',
                    entityId: req.params.id || req.body.id || null,
                    details: {
                        method: req.method,
                        url: req.originalUrl,
                        status: res.statusCode,
                        summary: req.body ? Object.keys(req.body).slice(0, 5) : []
                    },
                    ipAddress: req.ip || req.connection.remoteAddress
                });
            }
        });
        next();
    };
}

module.exports = {
    recordAudit,
    auditMiddleware
};
