const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const playersRoutes = require('./routes/players');
const localitiesRoutes = require('./routes/localities');
const facilitiesRoutes = require('./routes/facilities');
const reportsRoutes = require('./routes/reports');
const actionsRoutes = require('./routes/actions');
const impactRoutes = require('./routes/impact');
const sponsorsRoutes = require('./routes/sponsors');
const earlyWarningRoutes = require('./routes/earlyWarning');
const auditRoutes = require('./routes/audit');
const publicRoutes = require('./routes/public');
const sessionsRoutes = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing and JSON Body Parsing
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'KheloDisha API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/localities', localitiesRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/alerts', earlyWarningRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/sessions', sessionsRoutes);

// Serve static frontend build if available
const path = require('path');
const fs = require('fs');
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start listening if executed directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 KheloDisha Backend API running at http://localhost:${PORT}`);
    });
}

module.exports = app;
