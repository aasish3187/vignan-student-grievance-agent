// =====================================================================
// Notification Service — Agent 46
// Generates acknowledgements, escalation alerts, and resolution notices.
// For hackathon: logs to console + stores in DB. Real: email/SMS/WhatsApp.
// =====================================================================

const { v4: uuidv4 } = require('uuid');

// In-memory store for hackathon demo (also persisted to notifications table)
const notifications = [];

function acknowledge(data) {
  const notif = {
    id: uuidv4(),
    type: 'ACKNOWLEDGEMENT',
    title: `Grievance ${data.grievanceNo} — Received & Assigned`,
    body: `Your grievance has been received and assigned to ${data.assignedTo}. ` +
          `Category: ${data.category}. ` +
          `Expected resolution by: ${new Date(data.slaDueAt).toLocaleString()}.` +
          (data.isStatutory ? ' [STATUTORY: Routed directly to committee]' : ''),
    grievanceId: data.grievanceId,
    timestamp: new Date().toISOString()
  };

  notifications.push(notif);
  console.log(`[NOTIFICATION] ${notif.title}`);
  return notif;
}

function alertEscalation(data) {
  const notif = {
    id: uuidv4(),
    type: 'ESCALATION',
    title: `ESCALATION — ${data.grievanceNo}`,
    body: `Grievance ${data.grievanceNo} (${data.category}) has breached SLA by ${data.hoursOverdue} hours. ` +
          `Escalated from ${data.from} to ${data.to}.`,
    grievanceId: data.grievanceId,
    timestamp: new Date().toISOString()
  };

  notifications.push(notif);
  console.log(`[ESCALATION] ${notif.body}`);
  return notif;
}

function notifyResolution(data) {
  const notif = {
    id: uuidv4(),
    type: 'RESOLUTION',
    title: `Grievance ${data.grievanceNo} — Resolved`,
    body: `Your grievance (${data.category}) has been resolved. ` +
          `Resolution: ${data.resolution}. ` +
          `If you are not satisfied, you may appeal within 7 days.`,
    grievanceId: data.grievanceId,
    timestamp: new Date().toISOString()
  };

  notifications.push(notif);
  console.log(`[RESOLVED] ${notif.title}`);
  return notif;
}

function getAll() {
  return [...notifications].reverse();
}

function getForGrievance(grievanceId) {
  return notifications.filter(n => n.grievanceId === grievanceId);
}

module.exports = { acknowledge, alertEscalation, notifyResolution, getAll, getForGrievance };
