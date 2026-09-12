// =====================================================================
// Seed Data — Agent 46
// 60 sample grievances with intentional systemic patterns for demo.
// Departments, committees, users, routing rules, historical grievances.
// =====================================================================

const { v4: uuidv4 } = require('uuid');
const { classify } = require('../core/classifier');
const { route } = require('../core/router');
const { calculateDeadline } = require('../core/sla-engine');

const DEPT_IDS = {
  CSE: 'CSE', ECE: 'ECE', MECH: 'MECH',
  CIVIL: 'CIVIL', IT: 'IT', MBA: 'MBA'
};

const COMMITTEE_IDS = {
  ANTI_RAGGING: 'ANTI_RAGGING_COMMITTEE',
  ICC: 'ICC',
  EQUAL_OPP: 'EQUAL_OPPORTUNITY_CELL',
  GRIEVANCE_CELL: 'GRIEVANCE_CELL',
  SAFETY: 'SAFETY_COMMITTEE'
};

function seed(db) {
  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM departments').get().c;
  if (count > 0) {
    console.log('[Seed] Database already seeded. Skipping.');
    return;
  }

  console.log('[Seed] Seeding database with demo data...');

  // --- DEPARTMENTS ---
  const deptStmt = db.prepare('INSERT INTO departments (department_id, code, name) VALUES (?, ?, ?)');
  const departments = [
    [DEPT_IDS.CSE,  'CSE',  'Computer Science & Engineering'],
    [DEPT_IDS.ECE,  'ECE',  'Electronics & Communication Engineering'],
    [DEPT_IDS.MECH, 'MECH', 'Mechanical Engineering'],
    [DEPT_IDS.CIVIL,'CIVIL','Civil Engineering'],
    [DEPT_IDS.IT,   'IT',   'Information Technology'],
    [DEPT_IDS.MBA,  'MBA',  'Master of Business Administration']
  ];
  for (const d of departments) deptStmt.run(...d);

  // --- USERS ---
  const userStmt = db.prepare('INSERT INTO users (user_id, username, full_name, email, role, department_id) VALUES (?, ?, ?, ?, ?, ?)');
  const users = [
    ['student-001', 'akshay.g',    'Akshay Gupta',       'akshay@vignan.ac.in',   'STUDENT',           DEPT_IDS.CSE],
    ['student-002', 'priya.s',     'Priya Sharma',        'priya@vignan.ac.in',    'STUDENT',           DEPT_IDS.ECE],
    ['student-003', 'rahul.m',     'Rahul Mehta',         'rahul@vignan.ac.in',    'STUDENT',           DEPT_IDS.MECH],
    ['student-004', 'sneha.r',     'Sneha Reddy',         'sneha@vignan.ac.in',    'STUDENT',           DEPT_IDS.CSE],
    ['student-005', 'vikram.k',    'Vikram Kumar',        'vikram@vignan.ac.in',   'STUDENT',           DEPT_IDS.IT],
    ['hod-cse',     'ramesh.k',    'Dr. Ramesh Kumar',    'ramesh@vignan.ac.in',   'HOD',               DEPT_IDS.CSE],
    ['hod-ece',     'sunita.r',    'Dr. Sunita Reddy',    'sunita@vignan.ac.in',   'HOD',               DEPT_IDS.ECE],
    ['hod-mech',    'kumar.p',     'Dr. Kumar Prasad',    'kumarp@vignan.ac.in',   'HOD',               DEPT_IDS.MECH],
    ['dean-academics','venkat.r',  'Prof. Venkat Rao',    'venkat@vignan.ac.in',   'DEAN',              null],
    ['dean-student','lakshmi.d',   'Dr. Lakshmi Devi',    'lakshmi@vignan.ac.in',  'DEAN_STUDENT_AFFAIRS', null],
    ['coe',         'narasimha.s', 'Sri. Narasimha',      'coe@vignan.ac.in',      'COE',               null],
    ['icc-chair',   'padma.r',     'Dr. Padma Rani',      'padma@vignan.ac.in',    'COMMITTEE_MEMBER',  null],
    ['antirag-chair','suresh.b',   'Dr. Suresh Babu',     'suresh@vignan.ac.in',   'COMMITTEE_MEMBER',  null],
    ['iqac',        'anjali.v',    'Prof. Anjali Verma',  'anjali@vignan.ac.in',   'IQAC',              null],
    ['admin',       'admin',       'System Admin',        'admin@vignan.ac.in',    'ADMIN',             null]
  ];
  for (const u of users) userStmt.run(...u);

  // --- COMMITTEES ---
  const commStmt = db.prepare('INSERT INTO committees (committee_id, name, committee_type, is_statutory, mandate) VALUES (?, ?, ?, ?, ?)');
  const committees = [
    [COMMITTEE_IDS.ANTI_RAGGING, 'Anti-Ragging Committee',          'STATUTORY', 1, 'Prevention and action against ragging as per UGC regulations'],
    [COMMITTEE_IDS.ICC,          'Internal Complaints Committee',    'STATUTORY', 1, 'Handling sexual harassment complaints under POSH Act'],
    [COMMITTEE_IDS.EQUAL_OPP,    'Equal Opportunity Cell',          'STATUTORY', 1, 'Prevention of discrimination based on caste, religion, gender'],
    [COMMITTEE_IDS.GRIEVANCE_CELL,'Grievance Redressal Cell',       'ADMINISTRATIVE', 0, 'General student grievance resolution'],
    [COMMITTEE_IDS.SAFETY,       'Safety & Security Committee',     'STATUTORY', 1, 'Campus safety and emergency response']
  ];
  for (const c of committees) commStmt.run(...c);

  // --- COMMITTEE MEMBERS ---
  const memStmt = db.prepare('INSERT INTO committee_members (committee_member_id, committee_id, user_id, member_role, from_date) VALUES (?, ?, ?, ?, ?)');
  memStmt.run(uuidv4(), COMMITTEE_IDS.ANTI_RAGGING, 'antirag-chair', 'CHAIRPERSON', '2026-01-01');
  memStmt.run(uuidv4(), COMMITTEE_IDS.ANTI_RAGGING, 'dean-student',  'MEMBER',      '2026-01-01');
  memStmt.run(uuidv4(), COMMITTEE_IDS.ICC,          'icc-chair',      'CHAIRPERSON', '2026-01-01');
  memStmt.run(uuidv4(), COMMITTEE_IDS.ICC,          'dean-student',  'MEMBER',      '2026-01-01');
  memStmt.run(uuidv4(), COMMITTEE_IDS.GRIEVANCE_CELL,'dean-student', 'CONVENER',    '2026-01-01');
  memStmt.run(uuidv4(), COMMITTEE_IDS.SAFETY,       'dean-student',  'CHAIRPERSON', '2026-01-01');

  // --- SAMPLE GRIEVANCES ---
  const grievances = buildSampleGrievances();
  const gStmt = db.prepare(`
    INSERT INTO grievances (
      grievance_id, grievance_no, student_id, is_anonymous,
      category, severity, is_statutory_route, description,
      department_id, submitted_at, submitted_via,
      assigned_to_role, committee_id, sla_due_at,
      escalation_level, status, resolved_at, resolution,
      satisfaction_rating, classifier_confidence, classifier_keywords
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const evtStmt = db.prepare(`
    INSERT INTO grievance_events (grievance_event_id, grievance_id, occurred_at, event_type, actor_role, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const g of grievances) {
    const classification = classify(g.description);
    const routing = route(classification, g.department_id);
    const slaDue = calculateDeadline(classification.category, g.submitted_at);

    gStmt.run(
      g.id, g.grievance_no, g.student_id, g.is_anonymous ? 1 : 0,
      classification.category, g.severity || classification.severity,
      classification.isStatutoryRoute ? 1 : 0, g.description,
      g.department_id, g.submitted_at, 'WEB',
      routing.assignedRole, routing.committee || null, slaDue,
      g.escalation_level || 1, g.status,
      g.resolved_at || null, g.resolution || null,
      g.satisfaction_rating || null,
      classification.confidence, JSON.stringify(classification.keywords)
    );

    // Add events
    evtStmt.run(uuidv4(), g.id, g.submitted_at, 'SUBMITTED', 'STUDENT', 'Grievance submitted');
    evtStmt.run(uuidv4(), g.id, g.submitted_at, 'ACKNOWLEDGED', 'SYSTEM', `Assigned to ${routing.assignedRole}`);

    if (g.status !== 'RECEIVED') {
      evtStmt.run(uuidv4(), g.id, g.submitted_at, 'ASSIGNED', 'SYSTEM', `Routed to ${routing.description}`);
    }
    if (g.status === 'RESOLVED' || g.status === 'CLOSED') {
      evtStmt.run(uuidv4(), g.id, g.resolved_at, 'RESOLVED', 'HOD', g.resolution);
    }
    if (g.status === 'ESCALATED') {
      evtStmt.run(uuidv4(), g.id, g.submitted_at, 'ESCALATED', 'SYSTEM', 'AUTO-ESCALATION: SLA breached');
    }
  }

  console.log(`[Seed] Successfully seeded: ${departments.length} departments, ${users.length} users, ${committees.length} committees, ${grievances.length} grievances`);
}

function buildSampleGrievances() {
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

  return [
    // --- ACADEMIC / EXAMINATION cluster (35%) ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10001', student_id: 'student-001', is_anonymous: false, description: 'My mid-sem marks in DBMS show 15/30 but I wrote all questions correctly and my friend who wrote similar answers got 28/30. This is unfair evaluation.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(2), status: 'ASSIGNED', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10002', student_id: 'student-004', is_anonymous: false, description: 'The DBMS course internal marks distribution seems very biased. Multiple students have complained about inconsistent grading in mid-sem examination.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(5), status: 'IN_PROGRESS', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10003', student_id: 'student-001', is_anonymous: false, description: 'Request for revaluation of Data Structures end-sem paper. My marks seem too low compared to what I wrote on the exam.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(15), status: 'RESOLVED', resolved_at: daysAgo(10), resolution: 'Revaluation completed. Marks revised from 42 to 56.', satisfaction_rating: 5, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10004', student_id: 'student-002', is_anonymous: false, description: 'The signals and systems exam question paper had questions from topics not covered in the syllabus. At least 20 marks worth of questions were out of syllabus.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(8), status: 'RESOLVED', resolved_at: daysAgo(3), resolution: 'Committee reviewed the paper. 15 marks of out-of-syllabus questions identified. Grace marks awarded.', satisfaction_rating: 4, severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10005', student_id: 'student-003', is_anonymous: false, description: 'The internal marks for Thermodynamics have not been uploaded even though the deadline has passed. Faculty said they will do it but nothing happened for 2 weeks.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(14), status: 'RESOLVED', resolved_at: daysAgo(7), resolution: 'Faculty reminded and marks uploaded within 24 hours.', satisfaction_rating: 3, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10006', student_id: 'student-005', is_anonymous: false, description: 'My attendance is shown as 62% in Web Technologies but I have attended all classes. The biometric system did not record my attendance on multiple days.', department_id: DEPT_IDS.IT, submitted_at: daysAgo(3), status: 'ASSIGNED', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10007', student_id: 'student-001', is_anonymous: false, description: 'The DBMS lab assignments are not being evaluated fairly. Some students submit copied code and get full marks while original work gets less.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(6), status: 'ASSIGNED', severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10008', student_id: 'student-004', is_anonymous: false, description: 'Academic calendar shows classes on a declared holiday. Need clarification on whether we have to attend.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(20), status: 'CLOSED', resolved_at: daysAgo(18), resolution: 'Calendar error corrected. Holiday confirmed.', satisfaction_rating: 5, severity: 'LOW' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10009', student_id: 'student-002', is_anonymous: false, description: 'The course registration system did not allow me to register for an elective I wanted. System showed it was full but only 20 students registered.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(25), status: 'CLOSED', resolved_at: daysAgo(20), resolution: 'Technical glitch identified and fixed. Student registered manually.', satisfaction_rating: 4, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10010', student_id: 'student-005', is_anonymous: false, description: 'Examination hall was extremely hot with no working fans or AC during the end-semester exam. Multiple students felt unwell.', department_id: DEPT_IDS.IT, submitted_at: daysAgo(12), status: 'RESOLVED', resolved_at: daysAgo(8), resolution: 'Maintenance team deployed to fix AC. Backup fans arranged for remaining exams.', satisfaction_rating: 3, severity: 'HIGH' },

    // --- HOSTEL / INFRASTRUCTURE cluster (20%) — intentional Block-B pattern ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10011', student_id: 'student-003', is_anonymous: false, description: 'Block-B hostel room 204 has a severe water leakage problem from the bathroom. Water seeping into the room damaging our books and electronics.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(1), status: 'ASSIGNED', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10012', student_id: 'student-001', is_anonymous: false, description: 'Block-B hostel electrical wiring is exposed in the corridor near room 310. Serious safety hazard. Multiple sparking incidents reported.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(2), status: 'ASSIGNED', severity: 'CRITICAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10013', student_id: 'student-005', is_anonymous: false, description: 'Block-B hostel mess food quality has drastically declined. Found insects in dal twice this week. Many students are falling sick.', department_id: DEPT_IDS.IT, submitted_at: daysAgo(3), status: 'IN_PROGRESS', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10014', student_id: 'student-003', is_anonymous: false, description: 'Block-B hostel water supply is irregular. Hot water geyser not working for past 10 days. Multiple complaints to warden ignored.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(4), status: 'ASSIGNED', severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10015', student_id: 'student-002', is_anonymous: false, description: 'Block-B hostel wifi has been down for 3 days. Cannot access online study materials or submit assignments.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(5), status: 'RESOLVED', resolved_at: daysAgo(3), resolution: 'Network team fixed the router and upgraded bandwidth.', satisfaction_rating: 4, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10016', student_id: 'student-004', is_anonymous: false, description: 'Block-B hostel bathroom cleaning is not being done properly. Toilets are in very unhygienic condition.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(7), status: 'RESOLVED', resolved_at: daysAgo(5), resolution: 'Housekeeping staff increased and cleaning schedule revised.', satisfaction_rating: 2, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10017', student_id: 'student-001', is_anonymous: false, description: 'Block-B hostel room doors lock is broken. Reported to warden 2 weeks ago but no action taken. Personal belongings are at risk.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(10), status: 'ESCALATED', escalation_level: 2, severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10018', student_id: 'student-005', is_anonymous: false, description: 'Block-B hostel pest control is needed urgently. Cockroaches and mosquitoes everywhere. Students are getting dengue fever.', department_id: DEPT_IDS.IT, submitted_at: daysAgo(6), status: 'IN_PROGRESS', severity: 'HIGH' },

    // --- FEE disputes (15%) ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10019', student_id: 'student-002', is_anonymous: false, description: 'My fee payment was made through RTGS on 15th August but the system still shows outstanding dues. Receipt number: RTGS2026081234.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(8), status: 'RESOLVED', resolved_at: daysAgo(4), resolution: 'Payment reconciled with bank records. Outstanding cleared.', satisfaction_rating: 5, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10020', student_id: 'student-003', is_anonymous: false, description: 'Applied for fee concession under EWS category but no response for 45 days. Deadline for next semester fee is approaching.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(12), status: 'IN_PROGRESS', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10021', student_id: 'student-001', is_anonymous: false, description: 'Late fee penalty charged even though I paid before the deadline. System recorded wrong date. Need penalty reversal.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(18), status: 'CLOSED', resolved_at: daysAgo(14), resolution: 'System date error confirmed. Penalty of Rs.5000 reversed.', satisfaction_rating: 5, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10022', student_id: 'student-004', is_anonymous: false, description: 'Scholarship amount not credited for the current semester. AICTE scholarship was approved but no disbursement received.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(20), status: 'RESOLVED', resolved_at: daysAgo(10), resolution: 'Scholarship disbursement processed. Amount will be credited within 7 working days.', satisfaction_rating: 3, severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10023', student_id: 'student-005', is_anonymous: false, description: 'Hostel fee increased by 20% without any prior notice or improvement in facilities. This is unfair. Need fee revision or justification.', department_id: DEPT_IDS.IT, submitted_at: daysAgo(30), status: 'CLOSED', resolved_at: daysAgo(20), resolution: 'Fee revision circular shared. Breakdown of increased costs provided. Installment option offered.', satisfaction_rating: 2, severity: 'NORMAL' },

    // --- FACULTY CONDUCT (10%) ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10024', student_id: 'student-001', is_anonymous: false, description: 'Faculty member for Operating Systems does not come to class on time and often cancels lectures without prior notice. Syllabus completion is at risk.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(7), status: 'ASSIGNED', severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10025', student_id: 'student-002', is_anonymous: false, description: 'Professor in Digital Electronics shows partiality towards certain students in internal marks allocation. Not fair to rest of the class.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(9), status: 'IN_PROGRESS', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10026', student_id: 'student-003', is_anonymous: false, description: 'Faculty for Manufacturing Processes uses very rude language and humiliates students in front of the class when they ask questions.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(11), status: 'RESOLVED', resolved_at: daysAgo(5), resolution: 'Faculty counseled by HoD. Sensitization session conducted.', satisfaction_rating: 3, severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10027', student_id: 'student-005', is_anonymous: false, description: 'The faculty teaching Python Programming is reading directly from slides and not explaining concepts. No doubt clearing sessions.', department_id: DEPT_IDS.IT, submitted_at: daysAgo(15), status: 'CLOSED', resolved_at: daysAgo(8), resolution: 'HoD observed the class. Faculty advised to improve teaching methodology. Extra tutorial sessions arranged.', satisfaction_rating: 4, severity: 'NORMAL' },

    // --- TRANSPORT (5%) ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10028', student_id: 'student-002', is_anonymous: false, description: 'College bus on Route 7 is consistently 30 minutes late every day. Students are missing first period classes.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(4), status: 'ASSIGNED', severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10029', student_id: 'student-003', is_anonymous: false, description: 'Bus driver on Route 3 drives very rashly and overtakes dangerously. Students feel unsafe during travel.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(6), status: 'RESOLVED', resolved_at: daysAgo(2), resolution: 'Driver warned. GPS speed monitoring activated. Supervisor assigned to the route.', satisfaction_rating: 4, severity: 'HIGH' },

    // --- STATUTORY: RAGGING (critical bypass demo) ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10030', student_id: null, is_anonymous: true, description: 'A group of senior students in Block-C hostel are threatening first-year students and collecting money forcefully every weekend. They beat one student last week.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(1), status: 'ASSIGNED', severity: 'CRITICAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10031', student_id: null, is_anonymous: true, description: 'Seniors are forcing juniors to do their laundry and clean their rooms. If refused they bully and threaten consequences in ragging style.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(3), status: 'IN_PROGRESS', severity: 'CRITICAL' },

    // --- STATUTORY: HARASSMENT ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10032', student_id: null, is_anonymous: true, description: 'A faculty member makes inappropriate comments about female students appearance during class. Multiple girls feel uncomfortable and harassed.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(2), status: 'ASSIGNED', severity: 'CRITICAL' },

    // --- STATUTORY: DISCRIMINATION ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10033', student_id: null, is_anonymous: true, description: 'A professor made casteist remarks about SC/ST students in class saying they got admission only because of reservation and dont deserve to be here. Discrimination.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(4), status: 'ASSIGNED', severity: 'CRITICAL' },

    // --- MORE ACADEMIC/EXAMINATION for pattern demo ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10034', student_id: 'student-004', is_anonymous: false, description: 'DBMS mid-sem evaluation is inconsistent across sections. Section A average is 25/30 while Section B average is 15/30 for same paper.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(4), status: 'ASSIGNED', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10035', student_id: 'student-001', is_anonymous: false, description: 'DBMS course faculty changed the evaluation criteria after the exam was conducted. This was not communicated to students beforehand.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(3), status: 'ASSIGNED', severity: 'HIGH' },

    // --- SLA-breached cases for escalation demo ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10036', student_id: 'student-003', is_anonymous: false, description: 'Hostel room allocation is unfair. Applied for room change due to noise issues but no response from warden for 2 weeks.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(10), status: 'ASSIGNED', severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10037', student_id: 'student-002', is_anonymous: false, description: 'Transport pass fee charged twice. Raised complaint 2 weeks ago to accounts but no refund processed yet. No response at all.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(14), status: 'ASSIGNED', severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10038', student_id: 'student-005', is_anonymous: false, description: 'Lab equipment in Computer Networks lab is outdated and malfunctioning. Half the systems dont work. Practical sessions are wasted.', department_id: DEPT_IDS.IT, submitted_at: daysAgo(8), status: 'ASSIGNED', severity: 'NORMAL' },

    // --- Additional variety ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10039', student_id: 'student-001', is_anonymous: false, description: 'Library timing should be extended till 11 PM during exam season. Current 8 PM closing time is not sufficient for preparation.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(22), status: 'CLOSED', resolved_at: daysAgo(15), resolution: 'Library timings extended to 10:30 PM during exam weeks.', satisfaction_rating: 4, severity: 'LOW' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10040', student_id: 'student-004', is_anonymous: false, description: 'The placement cell is not sharing enough off-campus drive opportunities. Only on-campus drives are communicated. Need better placement support.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(25), status: 'CLOSED', resolved_at: daysAgo(18), resolution: 'Off-campus drive portal launched. WhatsApp group created for real-time notifications.', satisfaction_rating: 5, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10041', student_id: 'student-002', is_anonymous: false, description: 'Canteen food prices have increased significantly but quality remains the same. No vegetable options available most days.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(12), status: 'RESOLVED', resolved_at: daysAgo(8), resolution: 'Meeting with canteen vendor conducted. Price list revised. Veggie options mandated daily.', satisfaction_rating: 3, severity: 'LOW' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10042', student_id: 'student-003', is_anonymous: false, description: 'Workshop equipment in Mechanical workshop is unsafe. Safety guards missing from lathe machines. An accident waiting to happen.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(5), status: 'IN_PROGRESS', severity: 'CRITICAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10043', student_id: 'student-005', is_anonymous: false, description: 'MBA department does not have proper seminar hall. We have to share with engineering departments and always get the worst slots.', department_id: DEPT_IDS.MBA, submitted_at: daysAgo(16), status: 'RESOLVED', resolved_at: daysAgo(10), resolution: 'Dedicated seminar slot reserved for MBA Tue/Thu 2-5 PM. New seminar room approved for next semester.', satisfaction_rating: 4, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10044', student_id: 'student-001', is_anonymous: false, description: 'The college website does not have updated exam schedule. Students are confused about exam dates and seating arrangement.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(9), status: 'RESOLVED', resolved_at: daysAgo(6), resolution: 'Website updated with complete schedule. SMS notification system activated.', satisfaction_rating: 5, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10045', student_id: 'student-002', is_anonymous: false, description: 'Medical room in campus does not have basic first aid supplies. A student fainted during sports day and there was nothing available.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(7), status: 'ASSIGNED', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10046', student_id: 'student-004', is_anonymous: false, description: 'Printing facility in the department charges excessive rates compared to outside. Need college-subsidized printing service.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(28), status: 'CLOSED', resolved_at: daysAgo(22), resolution: 'Central printing facility rates revised. Digital submission option enabled for most assignments.', satisfaction_rating: 3, severity: 'LOW' },

    // --- More for reaching 60 count ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10047', student_id: 'student-003', is_anonymous: false, description: 'No proper drainage system in front of MECH block. Water stagnation during rainy season causes mosquito breeding and slippery conditions.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(11), status: 'ASSIGNED', severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10048', student_id: 'student-005', is_anonymous: false, description: 'College ID cards are not being issued for 3 months. Cannot access library or lab without proper ID. Temporary passes expire frequently.', department_id: DEPT_IDS.IT, submitted_at: daysAgo(35), status: 'CLOSED', resolved_at: daysAgo(25), resolution: 'New ID printing machine procured. All pending IDs issued within 1 week.', satisfaction_rating: 4, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10049', student_id: 'student-001', is_anonymous: false, description: 'Sports ground booking system is manual and biased. CSE department always gets priority for cricket ground while other departments struggle.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(18), status: 'CLOSED', resolved_at: daysAgo(12), resolution: 'Online booking system implemented with fair rotation policy across departments.', satisfaction_rating: 5, severity: 'LOW' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10050', student_id: 'student-002', is_anonymous: false, description: 'Examination hall seating arrangement is very cramped. Cannot write comfortably. Need at least one desk gap between students.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(14), status: 'RESOLVED', resolved_at: daysAgo(9), resolution: 'Seating layout revised. Additional halls allocated to ensure adequate spacing.', satisfaction_rating: 4, severity: 'NORMAL' },

    // --- A few more with mixed statuses ---
    { id: uuidv4(), grievance_no: 'GRV-2026-10051', student_id: 'student-003', is_anonymous: false, description: 'The civil engineering department lab has broken chairs and tables. Students have to stand during 3-hour lab sessions.', department_id: DEPT_IDS.CIVIL, submitted_at: daysAgo(6), status: 'ASSIGNED', severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10052', student_id: 'student-004', is_anonymous: false, description: 'No female washroom on the 3rd floor of CSE block. Girls have to go to ground floor which wastes time between classes.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(20), status: 'CLOSED', resolved_at: daysAgo(12), resolution: 'Washroom construction approved. Temporary facility arranged on 2nd floor.', satisfaction_rating: 4, severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10053', student_id: 'student-005', is_anonymous: false, description: 'The MBA internship stipend from college-arranged companies is very low (Rs.3000/month). Need better industry partnerships for fair compensation.', department_id: DEPT_IDS.MBA, submitted_at: daysAgo(22), status: 'RESOLVED', resolved_at: daysAgo(15), resolution: 'New MoUs signed with 5 companies guaranteeing minimum Rs.10000 stipend. Effective next batch.', satisfaction_rating: 5, severity: 'LOW' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10054', student_id: 'student-001', is_anonymous: false, description: 'Result declaration for supplementary exams is delayed by 2 months. Students cannot apply for placements without updated transcripts.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(30), status: 'CLOSED', resolved_at: daysAgo(20), resolution: 'Results published. Process streamlined to ensure 30-day turnaround for future supply results.', satisfaction_rating: 3, severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10055', student_id: 'student-002', is_anonymous: false, description: 'Guest lecture series promised at the start of the semester has not happened. No industry experts have visited ECE department this term.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(17), status: 'RESOLVED', resolved_at: daysAgo(10), resolution: '3 guest lectures scheduled in the coming month with speakers from TCS, Infosys, and ISRO.', satisfaction_rating: 4, severity: 'LOW' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10056', student_id: 'student-003', is_anonymous: false, description: 'Parking space for day scholars is inadequate. Vehicles are parked in a haphazard manner and bikes frequently get damaged.', department_id: DEPT_IDS.MECH, submitted_at: daysAgo(13), status: 'ASSIGNED', severity: 'LOW' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10057', student_id: 'student-004', is_anonymous: false, description: 'Blood donation camp organized without proper medical screening. Two students felt dizzy afterwards and no doctor was present on site.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(8), status: 'RESOLVED', resolved_at: daysAgo(4), resolution: 'Medical screening protocol updated. Mandatory doctor presence required for all future health camps.', satisfaction_rating: 4, severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10058', student_id: 'student-005', is_anonymous: false, description: 'ERP portal is very slow and crashes during peak hours like exam registration and result checking. Need infrastructure upgrade urgently.', department_id: DEPT_IDS.IT, submitted_at: daysAgo(10), status: 'IN_PROGRESS', severity: 'HIGH' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10059', student_id: 'student-001', is_anonymous: false, description: 'The project guide allotted to me does not have expertise in my topic area. Requested change 3 times but department is not responding.', department_id: DEPT_IDS.CSE, submitted_at: daysAgo(9), status: 'ASSIGNED', severity: 'NORMAL' },
    { id: uuidv4(), grievance_no: 'GRV-2026-10060', student_id: 'student-002', is_anonymous: false, description: 'Drinking water RO plant near the ECE block has been non-functional for a week. Students have to walk to the main building for water.', department_id: DEPT_IDS.ECE, submitted_at: daysAgo(3), status: 'ASSIGNED', severity: 'NORMAL' },
  ];
}

module.exports = { seed };
