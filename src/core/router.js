// =====================================================================
// Deterministic Router — Agent 46 Core Engine
// Routes grievances to the correct authority based on category.
// Stateless pure function. Consumes routing-rules.js config.
// =====================================================================

const { ROUTING_MAP } = require('../config/routing-rules');
const { SLA_HOURS } = require('../config/sla-policy');

/**
 * Route a classified grievance to the correct authority.
 * @param {{ category, severity, isStatutoryRoute }} classification
 * @param {string} [departmentId] - Student's department (for HOD routing)
 * @returns {{ assignedRole, description, committee, escalationChain, slaHours, isStatutory }}
 */
function route(classification, departmentId = null) {
  const { category, isStatutoryRoute } = classification;
  const rule = ROUTING_MAP[category] || ROUTING_MAP.OTHER;

  return {
    assignedRole: rule.authority,
    description: rule.description,
    committee: rule.committee || null,
    isStatutory: rule.isStatutory || false,
    escalationChain: [...rule.escalationChain],
    slaHours: SLA_HOURS[category] || SLA_HOURS.OTHER,
    departmentId
  };
}

/**
 * Get the next escalation target given the current level.
 * @param {string[]} escalationChain
 * @param {number} currentLevel - 1-indexed
 * @returns {{ nextRole: string|null, nextLevel: number, isTerminal: boolean }}
 */
function getNextEscalationTarget(escalationChain, currentLevel) {
  const nextLevel = currentLevel + 1;
  if (nextLevel > escalationChain.length) {
    return { nextRole: null, nextLevel: currentLevel, isTerminal: true };
  }
  return {
    nextRole: escalationChain[nextLevel - 1],
    nextLevel,
    isTerminal: nextLevel >= escalationChain.length
  };
}

module.exports = { route, getNextEscalationTarget };
