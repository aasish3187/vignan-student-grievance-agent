// =====================================================================
// Analytics Routes — Agent 46: Student Grievance System
// Role-Scoped Dashboard KPIs, Pattern Detection, SLA Reports & Heatmap
// Strictly Filtered by Authenticated Authority Mandate
// Vignan University — Agentic AI Day 2026
// =====================================================================

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics.service');

// GET /api/analytics/dashboard — Aggregated KPI cards (scoped)
router.get('/dashboard', (req, res) => {
  try {
    res.json({ success: true, data: analyticsService.getDashboardStats(req.user) });
  } catch (err) {
    res.status(500).json({ error: 'ANALYTICS_FAILED', message: err.message });
  }
});

// GET /api/analytics/patterns — Systemic pattern detection (scoped)
router.get('/patterns', (req, res) => {
  try {
    res.json({ success: true, data: analyticsService.detectPatterns(req.user) });
  } catch (err) {
    res.status(500).json({ error: 'PATTERN_FAILED', message: err.message });
  }
});

// GET /api/analytics/sla-compliance (scoped)
router.get('/sla-compliance', (req, res) => {
  try {
    res.json({ success: true, data: analyticsService.getSlaCompliance(req.user) });
  } catch (err) {
    res.status(500).json({ error: 'SLA_FAILED', message: err.message });
  }
});

// GET /api/analytics/satisfaction (scoped)
router.get('/satisfaction', (req, res) => {
  try {
    res.json({ success: true, data: analyticsService.getSatisfactionReport(req.user) });
  } catch (err) {
    res.status(500).json({ error: 'SATISFACTION_FAILED', message: err.message });
  }
});

// GET /api/analytics/heatmap — Department × Category matrix (scoped)
router.get('/heatmap', (req, res) => {
  try {
    res.json({ success: true, data: analyticsService.getHeatmap(req.user) });
  } catch (err) {
    res.status(500).json({ error: 'HEATMAP_FAILED', message: err.message });
  }
});

module.exports = router;
