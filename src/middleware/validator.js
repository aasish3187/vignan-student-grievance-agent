// =====================================================================
// Input Validator Middleware — Agent 46
// Validates grievance submissions and other inputs.
// =====================================================================

const { VALID_CATEGORIES } = require('../config/routing-rules');

/**
 * Strips dangerous HTML tags, javascript pseudo-protocols, and inline event handlers
 * to prevent Stored & Reflected Cross-Site Scripting (XSS).
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
    .trim();
}

function validateGrievanceSubmission(req, res, next) {
  if (req.body) {
    if (req.body.description) req.body.description = sanitizeText(req.body.description);
    if (req.body.complainant_name) req.body.complainant_name = sanitizeText(req.body.complainant_name);
    if (req.body.complainant_phone) req.body.complainant_phone = sanitizeText(req.body.complainant_phone);
    if (req.body.complainant_regd_no) req.body.complainant_regd_no = sanitizeText(req.body.complainant_regd_no);
  }

  const { description, category } = req.body || {};
  const errors = [];

  if (!description || description.trim().length < 20) {
    errors.push('Description must be at least 20 characters long to provide sufficient factual context');
  }

  if (description) {
    const cleanDesc = description.trim();
    if (cleanDesc.length > 5000) {
      errors.push('Description must be under 5000 characters');
    }

    // Factual Sufficiency & Anti-Gibberish Triage:
    // Detect single-character spam (e.g., 'aaaaaaaaaaaaaaaaaaaaa') or keyboard mash without spaces
    const words = cleanDesc.split(/\s+/).filter(w => w.length > 1);
    if (words.length < 4) {
      errors.push('Factual Sufficiency Filter: Please provide a descriptive sentence (at least 4 words) describing the incident, department, or issue.');
    }

    // Check for repetitive character spam (e.g. "asdfasdfasdfasdf", "xxxxxxxxx")
    const hasExcessiveRepetition = /(.)\1{6,}/i.test(cleanDesc);
    if (hasExcessiveRepetition) {
      errors.push('Quality Pre-Screening: Gibberish or excessive character repetition detected. Please provide authentic grievance details.');
    }
  }

  if (category && !VALID_CATEGORIES.includes(category.toUpperCase())) {
    errors.push(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', messages: errors });
  }

  // Normalize
  if (req.body.category) {
    req.body.category = req.body.category.toUpperCase();
  }

  next();
}

function validateResolution(req, res, next) {
  if (req.body && req.body.resolution) {
    req.body.resolution = sanitizeText(req.body.resolution);
  }

  const { resolution } = req.body || {};
  if (!resolution || resolution.trim().length < 10) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      messages: ['Resolution explanation must be at least 10 characters']
    });
  }
  next();
}

function validateSatisfaction(req, res, next) {
  if (req.body && req.body.comment) {
    req.body.comment = sanitizeText(req.body.comment);
  }

  const { rating } = req.body || {};
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      messages: ['Satisfaction rating must be between 1 and 5']
    });
  }
  next();
}

module.exports = {
  sanitizeText,
  validateGrievanceSubmission,
  validateResolution,
  validateSatisfaction
};
