// =====================================================================
// Escalation Service — Agent 46
// Scans all open grievances for SLA breaches and auto-escalates.
// The student should NEVER have to chase their own complaint.
// =====================================================================

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { checkBreach, calculateEscalationDeadline } = require('../core/sla-engine');
const { getNextEscalationTarget } = require('../core/router');
const { ROUTING_MAP } = require('../config/routing-rules');
const notificationService = require('./notification.service');

/**
 * Scan all open/assigned/in-progress grievances for SLA breaches
 * and auto-escalate those that exceed their deadline.
 * @returns {{ scanned, breached, escalated, details[] }}
 */
function scanAndEscalate() {
  const db = getDb();

  // Find all grievances that are still open and have an SLA deadline
  const openGrievances = db.prepare(`
    SELECT * FROM grievances
    WHERE status IN ('ASSIGNED', 'IN_PROGRESS', 'RECEIVED')
      AND sla_due_at IS NOT NULL
    ORDER BY sla_due_at ASC
  `).all();

  const results = {
    scanned: openGrievances.length,
    breached: 0,
    escalated: 0,
    details: [],
    timestamp: new Date().toISOString()
  };

  for (const grievance of openGrievances) {
    const breach = checkBreach(grievance);

    if (breach.isBreached) {
      results.breached++;

      // Get escalation chain for this category
      const routingRule = ROUTING_MAP[grievance.category] || ROUTING_MAP.OTHER;
      const escalation = getNextEscalationTarget(
        routingRule.escalationChain,
        grievance.escalation_level
      );

      if (!escalation.isTerminal) {
        // Perform escalation
        const newDeadline = calculateEscalationDeadline(escalation.nextLevel);

        db.prepare(`
          UPDATE grievances
          SET status = 'ESCALATED',
              escalation_level = ?,
              assigned_to_role = ?,
              sla_due_at = ?,
              updated_at = ?
          WHERE grievance_id = ?
        `).run(
          escalation.nextLevel,
          escalation.nextRole,
          newDeadline,
          new Date().toISOString(),
          grievance.grievance_id
        );

        // Log escalation event
        db.prepare(`
          INSERT INTO grievance_events (grievance_event_id, grievance_id, occurred_at, event_type, actor_user_id, actor_role, notes)
          VALUES (?, ?, ?, 'ESCALATED', NULL, 'SYSTEM', ?)
        `).run(
          uuidv4(),
          grievance.grievance_id,
          new Date().toISOString(),
          `AUTO-ESCALATION: SLA breached by ${breach.hoursOverdue} hours. ` +
          `Escalated from Level ${grievance.escalation_level} (${grievance.assigned_to_role}) ` +
          `to Level ${escalation.nextLevel} (${escalation.nextRole}). ` +
          `New deadline: ${new Date(newDeadline).toLocaleString()}`
        );

        // Then reassign back to ASSIGNED status for the new authority
        db.prepare(`
          UPDATE grievances SET status = 'ASSIGNED' WHERE grievance_id = ?
        `).run(grievance.grievance_id);

        // Log agent run
        db.prepare(`
          INSERT INTO agent_runs (agent_run_id, agent_code, trigger_type, grievance_id, action, output_data, started_at, finished_at, status)
          VALUES (?, 'A46_GRIEVANCE', 'SCHEDULED', ?, 'AUTO_ESCALATE', ?, ?, ?, 'SUCCEEDED')
        `).run(
          uuidv4(), grievance.grievance_id,
          JSON.stringify({ breach, escalation }),
          new Date().toISOString(),
          new Date().toISOString()
        );

        // Send notification
        notificationService.alertEscalation({
          grievanceId: grievance.grievance_id,
          grievanceNo: grievance.grievance_no,
          category: grievance.category,
          from: grievance.assigned_to_role,
          to: escalation.nextRole,
          hoursOverdue: breach.hoursOverdue
        });

        results.escalated++;
        results.details.push({
          grievanceNo: grievance.grievance_no,
          category: grievance.category,
          hoursOverdue: breach.hoursOverdue,
          from: grievance.assigned_to_role,
          to: escalation.nextRole,
          newDeadline
        });
      }
    }
  }

  return results;
}

module.exports = { scanAndEscalate };
