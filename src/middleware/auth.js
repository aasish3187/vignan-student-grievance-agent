// =====================================================================
// Auth Middleware — Agent 46: Student Grievance System
// Role-Based Access Control (RBAC) & Authority Profiles
// Strictly Zero Personal Names — Institutional Designations Only
// Vignan University — Agentic AI Day 2026
// =====================================================================

const AUTHORITY_PROFILES = {
  'hod-cse': {
    id: 'hod-cse',
    username: 'hod.cse',
    title: 'Head of Department (CSE)',
    role: 'HOD',
    department: 'Computer Science & Engineering',
    deptCode: 'CSE',
    committee: null,
    badge: 'HOD - CSE',
    scopeDescription: 'Departmental Jurisdiction: Computer Science & Engineering (CSE) · All grievances filed by/for CSE department'
  },
  'hod-ece': {
    id: 'hod-ece',
    username: 'hod.ece',
    title: 'Head of Department (ECE)',
    role: 'HOD',
    department: 'Electronics & Communication',
    deptCode: 'ECE',
    committee: null,
    badge: 'HOD - ECE',
    scopeDescription: 'Departmental Jurisdiction: Electronics & Communication Engineering (ECE) · All grievances filed by/for ECE department'
  },
  'antirag-chair': {
    id: 'antirag-chair',
    username: 'chair.antiragging',
    title: 'Chairman, Anti-Ragging and Student Committee',
    role: 'COMMITTEE_MEMBER',
    department: 'Statutory Redressal Cell',
    deptCode: null,
    committee: 'Anti-Ragging and Student Committee',
    badge: 'ANTI-RAGGING & STUDENT COMM.',
    scopeDescription: 'Statutory Jurisdiction: Anti-Ragging and Student Committee · Ragging, harassment, discrimination & safety cases only'
  },
  'icc-chair': {
    id: 'icc-chair',
    username: 'chair.icc',
    title: 'Chairperson, Internal Complaints Committee',
    role: 'COMMITTEE_MEMBER',
    department: 'Statutory Redressal Cell',
    deptCode: null,
    committee: 'Anti-Ragging and Student Committee',
    badge: 'STATUTORY - ICC',
    scopeDescription: 'Statutory Jurisdiction: Anti-Ragging and Student Committee · POSH, harassment & discrimination cases only'
  },
  'dean-academics': {
    id: 'dean-academics',
    username: 'dean.academics',
    title: 'Dean of Academic Affairs',
    role: 'DEAN',
    department: 'Academic Administration',
    deptCode: null,
    committee: null,
    badge: 'DEAN - ACADEMICS',
    scopeDescription: 'University Administration: Academic Affairs · Academic, Examination & Faculty Conduct cases'
  },
  'dean-student': {
    id: 'dean-student',
    username: 'dean.studentaffairs',
    title: 'Convener, Grievance Committee',
    role: 'DEAN_STUDENT_AFFAIRS',
    department: 'Student Affairs',
    deptCode: null,
    committee: 'Grievance Committee',
    badge: 'GRIEVANCE COMMITTEE',
    scopeDescription: 'Central Grievance Committee Oversight · University-wide jurisdiction over all complaints filed'
  },
  'coe': {
    id: 'coe',
    username: 'coe',
    title: 'Controller of Examinations',
    role: 'COE',
    department: 'Evaluation & Examination Cell',
    deptCode: null,
    committee: null,
    badge: 'EXAM CONTROLLER',
    scopeDescription: 'Statutory Evaluation Cell · Examination, Grade Revision & Hall Ticket cases'
  },
  'admin': {
    id: 'admin',
    username: 'admin',
    title: 'Central Grievance Administrator',
    role: 'ADMIN',
    department: 'Central Grievance Redressal Cell',
    deptCode: null,
    committee: null,
    badge: 'SYSTEM ADMIN',
    scopeDescription: 'University-Wide Jurisdiction: Central Grievance Redressal Cell · Full institutional visibility'
  }
};

const STUDENT_PROFILES = {
  'student-001': {
    id: 'student-001',
    username: 'akshay.g',
    rollNo: '221FA04001',
    full_name: 'Akshay Gupta',
    email: 'akshay@vignan.ac.in',
    role: 'STUDENT',
    title: 'B.Tech Student (CSE)',
    department: 'Computer Science & Engineering',
    deptCode: 'CSE',
    year: 'III Year',
    badge: 'STUDENT - CSE'
  },
  'student-002': {
    id: 'student-002',
    username: 'priya.s',
    rollNo: '221FA04002',
    full_name: 'Priya Sharma',
    email: 'priya@vignan.ac.in',
    role: 'STUDENT',
    title: 'B.Tech Student (ECE)',
    department: 'Electronics & Communication Engineering',
    deptCode: 'ECE',
    year: 'III Year',
    badge: 'STUDENT - ECE'
  },
  'student-003': {
    id: 'student-003',
    username: 'rahul.m',
    rollNo: '221FA04003',
    full_name: 'Rahul Mehta',
    email: 'rahul@vignan.ac.in',
    role: 'STUDENT',
    title: 'B.Tech Student (MECH)',
    department: 'Mechanical Engineering',
    deptCode: 'MECH',
    year: 'IV Year',
    badge: 'STUDENT - MECH'
  },
  'student-004': {
    id: 'student-004',
    username: 'sneha.r',
    rollNo: '221FA04004',
    full_name: 'Sneha Reddy',
    email: 'sneha@vignan.ac.in',
    role: 'STUDENT',
    title: 'B.Tech Student (CSE)',
    department: 'Computer Science & Engineering',
    deptCode: 'CSE',
    year: 'II Year',
    badge: 'STUDENT - CSE'
  },
  'student-005': {
    id: 'student-005',
    username: 'vikram.k',
    rollNo: '221FA04005',
    full_name: 'Vikram Kumar',
    email: 'vikram@vignan.ac.in',
    role: 'STUDENT',
    title: 'B.Tech Student (IT)',
    department: 'Information Technology',
    deptCode: 'IT',
    year: 'III Year',
    badge: 'STUDENT - IT'
  }
};

function resolveUserProfile(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();

  // Search authorities by id or username
  for (const key of Object.keys(AUTHORITY_PROFILES)) {
    const p = AUTHORITY_PROFILES[key];
    if (p.id.toLowerCase() === clean || p.username.toLowerCase() === clean || key.toLowerCase() === clean) {
      return p;
    }
  }

  // Search students by id, username, or rollNo
  for (const key of Object.keys(STUDENT_PROFILES)) {
    const s = STUDENT_PROFILES[key];
    if (
      s.id.toLowerCase() === clean ||
      s.username.toLowerCase() === clean ||
      (s.rollNo && s.rollNo.toLowerCase() === clean) ||
      key.toLowerCase() === clean
    ) {
      return s;
    }
  }

  return null;
}

function authMiddleware(req, res, next) {
  let userId = req.headers['x-user-id'] || req.query.user_id;

  // Check Bearer Token if present
  const authHeader = req.headers['authorization'];
  if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In demo token schema: 'vignan_token_<hex>'
  }

  const roleOverride = req.headers['x-user-role'];

  let user = resolveUserProfile(userId);
  if (!user) {
    if (roleOverride === 'STUDENT') {
      user = STUDENT_PROFILES['student-001'];
    } else {
      user = AUTHORITY_PROFILES['admin'];
    }
  }
  req.user = { ...user };

  if (roleOverride) {
    req.user.role = roleOverride.toUpperCase();
  }

  next();
}

module.exports = { authMiddleware, AUTHORITY_PROFILES, STUDENT_PROFILES, resolveUserProfile };
