// =====================================================================
// Notification Service — Agent 46
// Generates acknowledgements, escalation alerts, and resolution notices.
// For hackathon: logs to console + stores in DB. Real: email/SMS/WhatsApp.
// =====================================================================

const { v4: uuidv4 } = require('uuid');

const { getDb } = require('../config/database');

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
    grievanceNo: data.grievanceNo,
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
    grievanceNo: data.grievanceNo,
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
    grievanceNo: data.grievanceNo,
    timestamp: new Date().toISOString()
  };

  notifications.push(notif);
  console.log(`[RESOLVED] ${notif.title}`);
  return notif;
}

function notifyFeedback(data) {
  const notif = {
    id: uuidv4(),
    type: 'FEEDBACK',
    rating: Number(data.rating),
    comment: data.comment || '',
    grievanceId: data.grievanceId,
    grievanceNo: data.grievanceNo,
    category: data.category,
    departmentId: data.departmentId,
    title: `Student Redressal Feedback — ${data.grievanceNo}`,
    body: `Student rated ${data.rating}/5 stars.` + (data.comment ? ` Remarks: "${data.comment}"` : ''),
    timestamp: new Date().toISOString()
  };

  notifications.push(notif);
  console.log(`[FEEDBACK] ${notif.title} — Rating: ${data.rating}/5`);
  return notif;
}

function getAll() {
  const list = [...notifications];

  try {
    const db = getDb();
    const dbEvents = db.prepare(`
      SELECT ge.*, g.grievance_no, g.category, g.satisfaction_rating, g.satisfaction_comment, g.department_id
      FROM grievance_events ge
      JOIN grievances g ON ge.grievance_id = g.grievance_id
      WHERE ge.event_type IN ('SATISFACTION_RATED', 'SUBMITTED', 'ESCALATED', 'RESOLVED')
      ORDER BY ge.occurred_at DESC
      LIMIT 30
    `).all();

    const existingKeys = new Set(list.map(n => `${n.grievanceNo}_${n.type}_${n.timestamp}`));
    for (const evt of dbEvents) {
      let type = 'ACKNOWLEDGEMENT';
      let title = `Grievance ${evt.grievance_no}`;
      let body = evt.notes || '';
      let rating = null;
      let comment = null;

      if (evt.event_type === 'SATISFACTION_RATED') {
        type = 'FEEDBACK';
        const match = evt.notes ? evt.notes.match(/Rating: (\d)/) : null;
        rating = evt.satisfaction_rating || (match ? parseInt(match[1], 10) : 5);
        comment = evt.satisfaction_comment || '';
        title = `Student Redressal Feedback — ${evt.grievance_no}`;
        body = `Student rated ${rating}/5 stars.` + (comment ? ` Remarks: "${comment}"` : '');
      } else if (evt.event_type === 'ESCALATED') {
        type = 'ESCALATION';
        title = `ESCALATION — ${evt.grievance_no}`;
        body = evt.notes || 'SLA threshold breached. Auto-escalated.';
      } else if (evt.event_type === 'RESOLVED') {
        type = 'RESOLUTION';
        title = `Resolution Recorded — ${evt.grievance_no}`;
        body = evt.notes || 'Grievance resolved by authority.';
      } else if (evt.event_type === 'SUBMITTED') {
        type = 'ACKNOWLEDGEMENT';
        title = `New Grievance — ${evt.grievance_no}`;
        body = `Grievance lodged under pathway ${evt.category || 'General'}.`;
      }

      const key = `${evt.grievance_no}_${type}_${evt.occurred_at}`;
      if (!existingKeys.has(key)) {
        list.push({
          id: evt.grievance_event_id,
          type,
          rating,
          comment,
          grievanceId: evt.grievance_id,
          grievanceNo: evt.grievance_no,
          category: evt.category,
          departmentId: evt.department_id,
          title,
          body,
          timestamp: evt.occurred_at
        });
        existingKeys.add(key);
      }
    }
  } catch (err) {
    // DB query fallback
  }

  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return list.slice(0, 40);
}

function getForGrievance(grievanceId) {
  return notifications.filter(n => n.grievanceId === grievanceId);
}

module.exports = {
  acknowledge,
  alertEscalation,
  notifyResolution,
  notifyFeedback,
  getAll,
  getForGrievance
};
