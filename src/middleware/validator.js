// =====================================================================
// Input Validator Middleware — Agent 46
// Validates grievance submissions and other inputs.
// =====================================================================

const { VALID_CATEGORIES } = require('../config/routing-rules');

function validateGrievanceSubmission(req, res, next) {
  const { description, category } = req.body;
  const errors = [];

  if (!description || description.trim().length < 20) {
    errors.push('Description must be at least 20 characters long');
  }

  if (description && description.trim().length > 5000) {
    errors.push('Description must be under 5000 characters');
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
  const { resolution } = req.body;
  if (!resolution || resolution.trim().length < 10) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      messages: ['Resolution explanation must be at least 10 characters']
    });
  }
  next();
}

function validateSatisfaction(req, res, next) {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      messages: ['Satisfaction rating must be between 1 and 5']
    });
  }
  next();
}

module.exports = { validateGrievanceSubmission, validateResolution, validateSatisfaction };
