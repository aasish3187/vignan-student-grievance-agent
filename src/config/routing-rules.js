// =====================================================================
// Routing Rules Configuration — Agent 46
// Pure data. No logic. Consumed by router.js
// Maps categories to the correct authority/committee
// =====================================================================

const ROUTING_MAP = {
  // 1. Departments HOD (Academic, Exams, Faculty Conduct, Syllabus, Marks)
  ACADEMIC: {
    authority: 'HOD',
    description: 'Head of Department',
    escalationChain: ['HOD', 'DEAN_ACADEMICS', 'VC_OFFICE']
  },
  EXAMINATION: {
    authority: 'HOD',
    description: 'Head of Department',
    escalationChain: ['HOD', 'DEAN_ACADEMICS', 'VC_OFFICE']
  },
  FACULTY_CONDUCT: {
    authority: 'HOD',
    description: 'Head of Department',
    escalationChain: ['HOD', 'DEAN_ACADEMICS', 'VC_OFFICE']
  },

  // 2. Grievance Committee (Campus living, Hostel, Mess, Transport, Fee, Facilities, General)
  HOSTEL: {
    authority: 'GRIEVANCE_COMMITTEE',
    description: 'Grievance Redressal Committee',
    committee: 'GRIEVANCE_CELL',
    escalationChain: ['GRIEVANCE_COMMITTEE', 'DEAN_STUDENT_AFFAIRS', 'VC_OFFICE']
  },
  TRANSPORT: {
    authority: 'GRIEVANCE_COMMITTEE',
    description: 'Grievance Redressal Committee',
    committee: 'GRIEVANCE_CELL',
    escalationChain: ['GRIEVANCE_COMMITTEE', 'DEAN_STUDENT_AFFAIRS', 'VC_OFFICE']
  },
  INFRASTRUCTURE: {
    authority: 'GRIEVANCE_COMMITTEE',
    description: 'Grievance Redressal Committee',
    committee: 'GRIEVANCE_CELL',
    escalationChain: ['GRIEVANCE_COMMITTEE', 'DEAN_STUDENT_AFFAIRS', 'VC_OFFICE']
  },
  FEE: {
    authority: 'GRIEVANCE_COMMITTEE',
    description: 'Grievance Redressal Committee',
    committee: 'GRIEVANCE_CELL',
    escalationChain: ['GRIEVANCE_COMMITTEE', 'DEAN_STUDENT_AFFAIRS', 'VC_OFFICE']
  },
  OTHER: {
    authority: 'GRIEVANCE_COMMITTEE',
    description: 'Grievance Redressal Committee',
    committee: 'GRIEVANCE_CELL',
    escalationChain: ['GRIEVANCE_COMMITTEE', 'DEAN_STUDENT_AFFAIRS', 'VC_OFFICE']
  },

  // 3. Anti-Ragging and Student Committee (Ragging, Bullying, Harassment, Discrimination, Safety)
  RAGGING: {
    authority: 'ANTI_RAGGING_COMMITTEE',
    description: 'Anti-Ragging and Student Committee (Statutory)',
    committee: 'ANTI_RAGGING_COMMITTEE',
    isStatutory: true,
    escalationChain: ['ANTI_RAGGING_COMMITTEE', 'VC_OFFICE']
  },
  HARASSMENT: {
    authority: 'ANTI_RAGGING_COMMITTEE',
    description: 'Anti-Ragging and Student Committee (Statutory)',
    committee: 'ANTI_RAGGING_COMMITTEE',
    isStatutory: true,
    escalationChain: ['ANTI_RAGGING_COMMITTEE', 'VC_OFFICE']
  },
  DISCRIMINATION: {
    authority: 'ANTI_RAGGING_COMMITTEE',
    description: 'Anti-Ragging and Student Committee (Statutory)',
    committee: 'ANTI_RAGGING_COMMITTEE',
    isStatutory: true,
    escalationChain: ['ANTI_RAGGING_COMMITTEE', 'VC_OFFICE']
  },
  SAFETY: {
    authority: 'ANTI_RAGGING_COMMITTEE',
    description: 'Anti-Ragging and Student Committee (Statutory)',
    committee: 'ANTI_RAGGING_COMMITTEE',
    isStatutory: true,
    escalationChain: ['ANTI_RAGGING_COMMITTEE', 'VC_OFFICE']
  }
};

// All valid grievance categories (matches studentlife.grievance CHECK constraint)
const VALID_CATEGORIES = Object.keys(ROUTING_MAP);

module.exports = {
  ROUTING_MAP,
  VALID_CATEGORIES
};
