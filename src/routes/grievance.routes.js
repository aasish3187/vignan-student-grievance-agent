// =====================================================================
// Grievance Routes — Agent 46
// Thin controllers: parse HTTP, delegate to services, format responses.
// =====================================================================

const express = require('express');
const router = express.Router();
const grievanceService = require('../services/grievance.service');
const { validateGrievanceSubmission, validateResolution, validateSatisfaction } = require('../middleware/validator');
const { enforceStatutoryBypass, requireHumanDecision } = require('../middleware/guardrails');

// POST /api/grievances — Submit a new grievance
router.post('/',
  validateGrievanceSubmission,
  enforceStatutoryBypass,
  (req, res) => {
    try {
      const isAnon = Boolean(req.body.is_anonymous);
      const studentId = isAnon ? null : (req.body.student_id || (req.user?.role === 'STUDENT' ? req.user.id : null));

      const complainantName = isAnon ? null : (req.body.complainant_name || '').trim();
      const complainantRegdNo = isAnon ? null : (req.body.complainant_regd_no || '').trim().toUpperCase();
      const complainantPhone = isAnon ? null : (req.body.complainant_phone || '').trim();

      if (!isAnon && (!complainantName || !complainantRegdNo || !complainantPhone)) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          messages: ['Full Name, Registration Number, and Phone Number are required for identified grievance filing. Check Anonymous Mode if you wish to file confidentially without disclosing identity.']
        });
      }

      const result = grievanceService.submitGrievance({
        ...req.body,
        is_anonymous: isAnon,
        student_id: studentId,
        complainant_name: complainantName,
        complainant_regd_no: complainantRegdNo,
        complainant_phone: complainantPhone,
        submitted_via: req.body.submitted_via || 'WEB'
      });

      res.status(201).json({
        success: true,
        message: 'Grievance submitted successfully',
        data: result,
        guardrailActivated: req.guardrailActivated || false
      });
    } catch (err) {
      res.status(500).json({ error: 'SUBMISSION_FAILED', message: err.message });
    }
  }
);

// GET /api/grievances — List grievances (role-filtered for authorities)
router.get('/', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      department_id: req.query.department_id,
      student_id: req.user?.role === 'STUDENT' ? req.user.id : req.query.student_id,
      is_statutory_route: req.query.statutory === 'true' ? true : undefined,
      limit: parseInt(req.query.limit) || 100
    };

    const grievances = grievanceService.listGrievances(filters, req.user);
    res.json({ success: true, count: grievances.length, data: grievances });
  } catch (err) {
    res.status(500).json({ error: 'LIST_FAILED', message: err.message });
  }
});

// POST /api/grievances/track-student — Private student grievance tracker (Regd No + Phone)
router.post('/track-student', (req, res) => {
  try {
    const { regd_no, phone } = req.body || {};
    if (!regd_no || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Both Registration Number and Registered Phone Number are required to look up your personal grievances.'
      });
    }

    const grievances = grievanceService.getStudentGrievances(regd_no, phone);
    res.json({
      success: true,
      count: grievances.length,
      data: grievances
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/grievances/track-anonymous — Secure PIN-based anonymous tracking
router.post('/track-anonymous', (req, res) => {
  try {
    const { grievance_no, pin } = req.body || {};
    if (!grievance_no || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Both Grievance Reference Number and 6-digit Secret PIN are required'
      });
    }

    const grievance = grievanceService.getAnonymousGrievance(grievance_no, pin);
    res.json({ success: true, data: grievance });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// GET /api/grievances/:id — Full case detail with timeline
router.get('/:id', (req, res) => {
  try {
    const grievance = grievanceService.getGrievance(req.params.id);
    if (!grievance) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ success: true, data: grievance });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

// PUT /api/grievances/:id/resolve — Resolve with reasoning
router.put('/:id/resolve',
  validateResolution,
  requireHumanDecision,
  (req, res) => {
    try {
      const result = grievanceService.resolveGrievance(
        req.params.id, req.body.resolution, req.body.actor_user_id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'RESOLVE_FAILED', message: err.message });
    }
  }
);

// PUT /api/grievances/:id/appeal
router.put('/:id/appeal', (req, res) => {
  try {
    const result = grievanceService.appealGrievance(
      req.params.id, req.body.reason, req.user?.id
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: 'APPEAL_FAILED', message: err.message });
  }
});

// PUT /api/grievances/:id/satisfaction
router.put('/:id/satisfaction',
  validateSatisfaction,
  (req, res) => {
    try {
      const result = grievanceService.rateSatisfaction(
        req.params.id, req.body.rating, req.body.comment, req.user?.id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'RATING_FAILED', message: err.message });
    }
  }
);

// GET /api/grievances/:id/precedents — Retrieve similar historical precedent rulings
router.get('/:id/precedents', (req, res) => {
  try {
    const precedents = grievanceService.getPrecedents(req.params.id);
    res.json({ success: true, count: precedents.length, data: precedents });
  } catch (err) {
    res.status(500).json({ error: 'PRECEDENTS_FAILED', message: err.message });
  }
});

// GET /api/grievances/:id/resolution-letter — Generate formal institutional resolution order letter
router.get('/:id/resolution-letter', (req, res) => {
  try {
    const letter = grievanceService.generateResolutionLetter(req.params.id);
    res.json({ success: true, data: letter });
  } catch (err) {
    res.status(500).json({ error: 'RESOLUTION_LETTER_FAILED', message: err.message });
  }
});

module.exports = router;
