// =====================================================================
// SLA Engine — Agent 46 Core Engine
// State machine + deadline calculation + breach detection.
// Stateless pure functions. No DB access.
// =====================================================================

const { SLA_HOURS, ESCALATION_TIERS } = require('../config/sla-policy');

// Valid state transitions
const STATE_MACHINE = {
  RECEIVED:     ['ASSIGNED', 'ESCALATED'],
  ASSIGNED:     ['IN_PROGRESS', 'ESCALATED', 'RESOLVED'],
  IN_PROGRESS:  ['RESOLVED', 'ESCALATED'],
  RESOLVED:     ['CLOSED', 'APPEALED'],
  APPEALED:     ['ASSIGNED', 'IN_PROGRESS', 'ESCALATED'],
  ESCALATED:    ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
  CLOSED:       []  // terminal state
};

/**
 * Check if a state transition is valid.
 */
function isValidTransition(fromStatus, toStatus) {
  const allowed = STATE_MACHINE[fromStatus];
  return allowed ? allowed.includes(toStatus) : false;
}

/**
 * Calculate the SLA deadline for a grievance.
 * @param {string} category
 * @param {string|Date} submittedAt
 * @returns {string} ISO datetime of SLA deadline
 */
function calculateDeadline(category, submittedAt) {
  const hours = SLA_HOURS[category] || SLA_HOURS.OTHER;
  const submitted = new Date(submittedAt);
  const deadline = new Date(submitted.getTime() + hours * 60 * 60 * 1000);
  return deadline.toISOString();
}

/**
 * Check if a grievance has breached its SLA.
 * @param {{ sla_due_at, status, escalation_level, category }} grievance
 * @returns {{ isBreached, hoursOverdue, nextEscalationTier }}
 */
function checkBreach(grievance) {
  const now = new Date();
  const deadline = new Date(grievance.sla_due_at);

  if (!grievance.sla_due_at || now <= deadline) {
    return { isBreached: false, hoursOverdue: 0, nextEscalationTier: null };
  }

  const hoursOverdue = Math.round((now - deadline) / (1000 * 60 * 60) * 10) / 10;
  const currentLevel = grievance.escalation_level || 1;
  const nextTier = ESCALATION_TIERS.find(t => t.level === currentLevel + 1) || null;

  return {
    isBreached: true,
    hoursOverdue,
    nextEscalationTier: nextTier
  };
}

/**
 * Calculate new SLA deadline after an escalation.
 * @param {number} nextLevel
 * @returns {string} ISO datetime
 */
function calculateEscalationDeadline(nextLevel) {
  const tier = ESCALATION_TIERS.find(t => t.level === nextLevel);
  const hours = tier ? tier.maxHours : 24;
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  return deadline.toISOString();
}

/**
 * Get remaining time until SLA deadline.
 * @param {string} slaDueAt
 * @returns {{ hoursRemaining, isOverdue, urgency }}
 */
function getTimeRemaining(slaDueAt) {
  if (!slaDueAt) return { hoursRemaining: null, isOverdue: false, urgency: 'UNKNOWN' };

  const now = new Date();
  const deadline = new Date(slaDueAt);
  const hoursRemaining = Math.round((deadline - now) / (1000 * 60 * 60) * 10) / 10;

  let urgency = 'NORMAL';
  if (hoursRemaining < 0) urgency = 'OVERDUE';
  else if (hoursRemaining < 6) urgency = 'CRITICAL';
  else if (hoursRemaining < 24) urgency = 'WARNING';

  return {
    hoursRemaining,
    isOverdue: hoursRemaining < 0,
    urgency
  };
}

module.exports = {
  STATE_MACHINE,
  isValidTransition,
  calculateDeadline,
  checkBreach,
  calculateEscalationDeadline,
  getTimeRemaining
};
