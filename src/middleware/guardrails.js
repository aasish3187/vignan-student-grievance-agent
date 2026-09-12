// =====================================================================
// Guardrails Middleware — Agent 46
// Enforces statutory routing bypass and human decision requirement.
//
// RULE: Grievances involving HARASSMENT, RAGGING, DISCRIMINATION, or
// SAFETY must NEVER be summarized, judged, or triaged autonomously.
// The agent's role is intake, routing, and timeline tracking ONLY.
// =====================================================================

const { STATUTORY_CATEGORIES } = require('../config/sla-policy');

/**
 * Pre-processing guardrail on grievance submission.
 * If statutory keywords detected, blocks AI summarization and forces statutory route.
 */
function enforceStatutoryBypass(req, res, next) {
  if (req.body && req.body.category) {
    const category = req.body.category.toUpperCase();
    if (STATUTORY_CATEGORIES.includes(category)) {
      // Force statutory flags — cannot be overridden
      req.body.is_statutory_route = true;
      req.body.severity = 'CRITICAL';

      // Strip any AI-generated fields that should not exist for statutory cases
      delete req.body.ai_summary;
      delete req.body.ai_triage;
      delete req.body.ai_recommendation;

      // Log guardrail activation
      req.guardrailActivated = true;
      req.guardrailReason = `Statutory category ${category} detected — bypassing autonomous processing`;
    }
  }
  next();
}

/**
 * Post-processing guardrail on resolution.
 * Ensures a human actor is specified — no automated closures.
 */
function requireHumanDecision(req, res, next) {
  const action = req.params.action || req.path.split('/').pop();

  if (['resolve', 'close'].includes(action)) {
    const actorId = req.body.actor_user_id || req.user?.id;
    if (!actorId) {
      return res.status(403).json({
        error: 'HUMAN_DECISION_REQUIRED',
        message: 'All resolutions and closures require a human decision-maker. Automated closures are prohibited.'
      });
    }
    req.body.actor_user_id = actorId;
  }
  next();
}

module.exports = { enforceStatutoryBypass, requireHumanDecision };
