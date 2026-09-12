// =====================================================================
// Server Entry Point — Agent 46: Student Grievance Agent
// Mounts routes, initializes DB, seeds demo data, starts SLA cron.
// Vignan University — Agentic AI Day 2026
// =====================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

// Config
const { initSchema } = require('./src/config/database');

// Middleware
const { authMiddleware } = require('./src/middleware/auth');

// Routes
const grievanceRoutes = require('./src/routes/grievance.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const adminRoutes = require('./src/routes/admin.routes');
const authRoutes = require('./src/routes/auth.routes');
const integrationRoutes = require('./src/routes/integration.routes');

// Services
const { scanAndEscalate } = require('./src/services/escalation.service');

// Seed
const { seed } = require('./src/seed/seed-data');

// ---------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pipeline
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);

// Static files (student portal + admin dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------
// Mount API routes
// ---------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    agent: 'Agent 46 — Student Grievance Agent',
    status: 'ACTIVE',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    institution: 'Vignan University',
    event: 'Agentic AI Day 2026'
  });
});

// ---------------------------------------------------------------
// Initialize database and seed
// ---------------------------------------------------------------
console.log('\n[AGENT 46] Student Grievance Redressal System');
console.log('   Central Grievance Redressal Cell · Vignan University\n');

const db = initSchema();
console.log('[DB] Database schema initialized');

seed(db);

// ---------------------------------------------------------------
// SLA Cron Job & Server Startup
// ---------------------------------------------------------------
if (require.main === module) {
  // Scans for breaches every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('\n[SLA CRON] Running SLA breach scan...');
    const result = scanAndEscalate();
    console.log(`   Scanned: ${result.scanned} | Breached: ${result.breached} | Escalated: ${result.escalated}`);
    if (result.details.length > 0) {
      result.details.forEach(d => {
        console.log(`   [ESCALATED] ${d.grievanceNo} (${d.category}): ${d.from} → ${d.to} [${d.hoursOverdue}h overdue]`);
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`\n[SERVER] Server running at http://localhost:${PORT}`);
    console.log(`   Student Portal:    http://localhost:${PORT}/`);
    console.log(`   Admin Dashboard:   http://localhost:${PORT}/admin.html`);
    console.log(`   Health Check:      http://localhost:${PORT}/api/health`);
    console.log(`   SLA Cron:          Running every 5 minutes\n`);
  });
}

module.exports = app;
