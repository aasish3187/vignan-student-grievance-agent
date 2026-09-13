// =====================================================================
// Admin Routes — Agent 46
// SLA check trigger, escalation log, committee info, routing rules.
// =====================================================================

const express = require('express');
const router = express.Router();
const { scanAndEscalate } = require('../services/escalation.service');
const { getDb } = require('../config/database');
const { ROUTING_MAP } = require('../config/routing-rules');
const notificationService = require('../services/notification.service');
const { requireAuthority } = require('../middleware/auth');
const { buildScopeClause } = require('../services/analytics.service');

// Enforce officer clearance for all admin routes
router.use(requireAuthority);

// POST /api/admin/sla-check — Trigger SLA breach scan + auto-escalation
router.post('/sla-check', (req, res) => {
  try {
    const result = scanAndEscalate();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: 'SLA_CHECK_FAILED', message: err.message });
  }
});

// GET /api/admin/escalation-log — All escalation events (scoped)
router.get('/escalation-log', (req, res) => {
  try {
    const db = getDb();
    const scopeG = buildScopeClause(req.user, 'g');
    const events = db.prepare(`
      SELECT ge.*, g.grievance_no, g.category, g.severity
      FROM grievance_events ge
      JOIN grievances g ON g.grievance_id = ge.grievance_id
      WHERE ge.event_type = 'ESCALATED' ${scopeG.clause}
      ORDER BY ge.occurred_at DESC
    `).all(...scopeG.params);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ error: 'LOG_FAILED', message: err.message });
  }
});

// GET /api/admin/committees — Committee composition
router.get('/committees', (req, res) => {
  try {
    const db = getDb();
    const committees = db.prepare('SELECT * FROM committees').all();
    const members = db.prepare(`
      SELECT cm.*, u.full_name, u.role as user_role
      FROM committee_members cm
      LEFT JOIN users u ON u.user_id = cm.user_id
    `).all();

    // Group members by committee
    for (const c of committees) {
      c.members = members.filter(m => m.committee_id === c.committee_id);
    }

    res.json({ success: true, data: committees });
  } catch (err) {
    res.status(500).json({ error: 'COMMITTEE_FAILED', message: err.message });
  }
});

// GET /api/admin/routing-rules — Current routing configuration
router.get('/routing-rules', (req, res) => {
  res.json({ success: true, data: ROUTING_MAP });
});

// GET /api/admin/notifications — All notifications
router.get('/notifications', (req, res) => {
  res.json({ success: true, data: notificationService.getAll() });
});

// GET /api/admin/agent-runs — Agent audit trail
router.get('/agent-runs', (req, res) => {
  try {
    const db = getDb();
    const runs = db.prepare('SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 50').all();
    res.json({ success: true, data: runs });
  } catch (err) {
    res.status(500).json({ error: 'RUNS_FAILED', message: err.message });
  }
});

// POST /api/admin/whatsapp-test — Test automated server-to-phone WhatsApp dispatch
router.post('/whatsapp-test', (req, res) => {
  try {
    const { toPhone, message } = req.body;
    const targetPhone = toPhone || req.user?.phone || '+91-9876543210';
    const dispatchService = require('../services/dispatch.service');
    const result = dispatchService.testDispatch(targetPhone, message);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: 'WHATSAPP_TEST_FAILED', message: err.message });
  }
});

module.exports = router;
