const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'khelodisha-super-secret-jwt-key-odisha-sports-2026';

/**
 * Verifies JWT token and attaches user to req.user
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Public role fallback if request allows unauthenticated access
        req.user = {
            id: 'GUEST',
            role: 'public',
            full_name: 'Public Citizen',
            locality_id: null
        };
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired authentication token.' });
        }
        req.user = user;
        next();
    });
}

/**
 * Enforces role-based permissions
 * @param {Array<string>} allowedRoles
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        // Admin has superuser access to all endpoints
        if (req.user.role === 'admin') {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'`
            });
        }

        next();
    };
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    requireRole
};
