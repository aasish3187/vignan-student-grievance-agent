// =====================================================================
// Anonymizer — Agent 46 Core Engine
// Cryptographic identity decoupling for anonymous grievances.
// When is_anonymous = true, there is NO database path from the
// grievance back to the student. The FK is NULL.
// =====================================================================

const crypto = require('crypto');

/**
 * Generate a cryptographically random anonymous submission ID.
 * This ID has zero correlation with any student identity.
 */
function generateAnonymousId() {
  return 'ANON-' + crypto.randomBytes(16).toString('hex');
}

/**
 * Sanitize grievance data for anonymous submission.
 * Strips all identity-linking fields.
 * @param {object} data - Raw grievance submission
 * @returns {object} Sanitized data with student_id = null
 */
function sanitizeForStorage(data) {
  const sanitized = { ...data };

  // Remove all identity-linking fields
  sanitized.student_id = null;
  delete sanitized.student_name;
  delete sanitized.email;
  delete sanitized.phone;
  delete sanitized.roll_no;
  delete sanitized.registration_no;

  // Set anonymous flag
  sanitized.is_anonymous = 1;
  sanitized.anonymous_token = generateAnonymousId();

  return sanitized;
}

/**
 * Verify that a stored anonymous grievance has no identity leakage.
 * Used for audit/compliance checks.
 * @param {object} grievance - Stored grievance record
 * @returns {{ isSecure: boolean, violations: string[] }}
 */
function auditAnonymity(grievance) {
  const violations = [];

  if (grievance.is_anonymous && grievance.student_id) {
    violations.push('Anonymous grievance has a non-null student_id — identity leakage');
  }

  return {
    isSecure: violations.length === 0,
    violations
  };
}

module.exports = { generateAnonymousId, sanitizeForStorage, auditAnonymity };
