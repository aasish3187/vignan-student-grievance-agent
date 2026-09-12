// =====================================================================
// SLA Policy Configuration — Agent 46
// Pure data. No logic. Consumed by sla-engine.js
// Maps to: studentlife.grievance.sla_due_at calculation
// =====================================================================

const SLA_HOURS = {
  // Anti-Ragging and Student Committee (Statutory Fast-Track)
  RAGGING:          48,
  HARASSMENT:       48,
  DISCRIMINATION:   48,
  SAFETY:           48,

  // Departments HOD (Academic, Exams, Faculty Conduct)
  ACADEMIC:         120,  // 5 working days
  EXAMINATION:      120,  // 5 working days
  FACULTY_CONDUCT:  120,  // 5 working days

  // Grievance Committee (Campus Living, Hostel, Transport, Facilities, Fee, General)
  HOSTEL:           72,   // 3 working days
  TRANSPORT:        72,   // 3 working days
  INFRASTRUCTURE:   72,   // 3 working days
  FEE:              72,   // 3 working days
  OTHER:            72    // 3 working days
};

// Escalation tiers — each level has a max wait before auto-escalating to next
const ESCALATION_TIERS = [
  { level: 1, role: 'ASSIGNED_AUTHORITY', maxHours: null },  // initial — uses SLA_HOURS
  { level: 2, role: 'HOD',               maxHours: 48 },
  { level: 3, role: 'DEAN',              maxHours: 24 },
  { level: 4, role: 'VC_OFFICE',         maxHours: 12 }
];

// Statutory categories that bypass normal routing entirely
const STATUTORY_CATEGORIES = ['HARASSMENT', 'RAGGING', 'DISCRIMINATION', 'SAFETY'];

// Severity auto-assignment rules
const SEVERITY_RULES = {
  STATUTORY_DEFAULT: 'CRITICAL',
  NORMAL_DEFAULT:    'NORMAL'
};

module.exports = {
  SLA_HOURS,
  ESCALATION_TIERS,
  STATUTORY_CATEGORIES,
  SEVERITY_RULES
};
