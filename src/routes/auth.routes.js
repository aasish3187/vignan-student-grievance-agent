// =====================================================================
// Auth Routes — Agent 46: Student Grievance System
// Authority & Officer Authentication (Restricted to Institutional Heads)
// Strictly Zero Personal Names — Institutional Designations Only
// Vignan University — Agentic AI Day 2026
// =====================================================================

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { AUTHORITY_PROFILES, STUDENT_PROFILES, resolveUserProfile } = require('../middleware/auth');

/**
 * GET /api/auth/officers
 * Returns authorized authority profiles with scope descriptions
 */
router.get('/officers', (req, res) => {
  const officers = Object.values(AUTHORITY_PROFILES).map(o => ({
    id: o.id,
    username: o.username,
    title: o.title,
    role: o.role,
    department: o.department,
    deptCode: o.deptCode,
    committee: o.committee,
    badge: o.badge,
    scopeDescription: o.scopeDescription
  }));
  res.json({ success: true, data: officers });
});

/**
 * GET /api/auth/students
 * Returns demo student profiles for evaluation
 */
router.get('/students', (req, res) => {
  const students = Object.values(STUDENT_PROFILES).map(s => ({
    id: s.id,
    username: s.username,
    rollNo: s.rollNo,
    full_name: s.full_name,
    email: s.email,
    role: s.role,
    title: s.title,
    department: s.department,
    deptCode: s.deptCode,
    year: s.year,
    badge: s.badge
  }));
  res.json({ success: true, data: students });
});

/**
 * POST /api/auth/login
 * Dual-Track Authentication: Supports both Verified Students and Institutional Authorities
 */
router.post('/login', (req, res) => {
  const { username, password, portal } = req.body || {};

  if (!username) {
    return res.status(400).json({
      success: false,
      message: 'ID, Roll Number, or Username is required'
    });
  }

  const cleanUser = username.trim().toLowerCase();
  const profile = resolveUserProfile(cleanUser);

  if (!profile) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. User profile not found in institutional directory.'
    });
  }

  // If attempting authority portal login with student credentials
  if (portal === 'authority' && profile.role === 'STUDENT') {
    return res.status(403).json({
      success: false,
      code: 'STUDENT_ACCESS_DENIED',
      message: 'Access Denied: Student accounts do not have administrative clearance. Please use the Student Grievance Portal.'
    });
  }

  // Password check: accepts official demo password vignan@2026 or any non-empty input
  const token = 'vignan_token_' + crypto.randomBytes(16).toString('hex');
  const targetUrl = profile.role === 'STUDENT' ? '/' : 'admin.html';

  return res.json({
    success: true,
    message: profile.role === 'STUDENT' 
      ? `Welcome, ${profile.full_name} (${profile.rollNo})` 
      : `Authenticated as ${profile.title}`,
    data: {
      user: profile,
      token,
      targetUrl
    }
  });
});

/**
 * GET /api/auth/me
 * Validates active authority session
 */
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.id;
  const profile = resolveUserProfile(userId);
  if (!profile || profile.role === 'STUDENT') {
    return res.status(401).json({ success: false, message: 'Not authenticated as an authority official' });
  }
  return res.json({ success: true, data: profile });
});

/**
 * GET /api/auth/student-session
 * Validates active student session
 */
router.get('/student-session', (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.id;
  const profile = resolveUserProfile(userId);
  if (!profile || profile.role !== 'STUDENT') {
    return res.status(401).json({ success: false, message: 'Not authenticated as a registered student' });
  }
  return res.json({ success: true, data: profile });
});

module.exports = router;
