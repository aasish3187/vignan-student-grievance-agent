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
const { apiLimiter } = require('./src/middleware/rate-limiter');

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
// Initialize & Harden Server
// ---------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Enable reverse proxy support (Render/Cloudflare) to accurately read client IP for rate limiting
app.set('trust proxy', 1);

// Security Hardening: Disable Express fingerprinting
app.disable('x-powered-by');

// Security Hardening: HTTP Security Headers (OWASP A05 Defense)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.callmebot.com https://api.twilio.com; frame-ancestors 'self';"
  );
  next();
});

// Middleware pipeline: CORS, Payload Cap, Global Anti-Flood Rate Limiter
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/api', apiLimiter);
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
    securityStatus: 'HARDENED (Zero-Trust RBAC & Anti-Spam Active)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    institution: 'Vignan University',
    event: 'Agentic AI Day 2026'
  });
});

// Centralized Security Error Handler (Prevents stack trace leaks)
app.use((err, req, res, next) => {
  console.error('[SECURITY AUDIT] Exception trapped:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: 'SECURITY_CONTROLLED_EXCEPTION',
    message: 'An internal error occurred. Detailed traces are withheld in compliance with institutional cyber-security standards.'
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
