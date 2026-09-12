-- =====================================================================
-- Vignan University — Student Grievance Redressal System (Agent 46)
-- Enterprise Production PostgreSQL / Supabase Migration Schema
-- Conforms to UGC (Redressal of Grievances of Students) Regulations 2023,
-- AICTE Mandates, and NAAC Criterion 5.1.5 Data Governance.
-- =====================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Departments (Academic & Operational Divisions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  department_id   TEXT PRIMARY KEY,
  code            VARCHAR(20) NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  hod_user_id     TEXT
);

-- ---------------------------------------------------------------------
-- 2. Institutional Users & Authorities (Students, HoDs, Deans, Staff)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id         TEXT PRIMARY KEY,
  username        VARCHAR(100) NOT NULL UNIQUE,
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  role            VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
  department_id   TEXT REFERENCES departments(department_id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. Statutory & Institutional Redressal Committees
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS committees (
  committee_id    TEXT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  committee_type  VARCHAR(50) CHECK (committee_type IN ('STATUTORY','ACADEMIC','ADMINISTRATIVE','ADVISORY','AD_HOC')),
  is_statutory    BOOLEAN NOT NULL DEFAULT FALSE,
  mandate         TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','ARCHIVED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. Committee Memberships & Institutional Oversight Roles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS committee_members (
  committee_member_id TEXT PRIMARY KEY,
  committee_id    TEXT NOT NULL REFERENCES committees(committee_id) ON DELETE CASCADE,
  user_id         TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  member_role     VARCHAR(50) NOT NULL CHECK (member_role IN (
    'CHAIRPERSON','CONVENER','MEMBER','MEMBER_SECRETARY','SPECIAL_INVITEE','STUDENT_REPRESENTATIVE'
  )),
  from_date       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 5. Grievances (Central Case Registry)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grievances (
  grievance_id          TEXT PRIMARY KEY,
  grievance_no          VARCHAR(50) NOT NULL UNIQUE,
  student_id            TEXT,
  is_anonymous          BOOLEAN NOT NULL DEFAULT FALSE,
  category              VARCHAR(50) NOT NULL CHECK (category IN (
    'ACADEMIC','EXAMINATION','FEE','HOSTEL','TRANSPORT','INFRASTRUCTURE',
    'FACULTY_CONDUCT','HARASSMENT','DISCRIMINATION','RAGGING','SAFETY','OTHER'
  )),
  severity              VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (severity IN ('LOW','NORMAL','HIGH','CRITICAL')),
  is_statutory_route    BOOLEAN NOT NULL DEFAULT FALSE,
  description           TEXT NOT NULL,
  department_id         TEXT REFERENCES departments(department_id) ON DELETE SET NULL,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_via         VARCHAR(50) DEFAULT 'WEB',
  assigned_to_user_id   TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  assigned_to_role      VARCHAR(100),
  committee_id          TEXT REFERENCES committees(committee_id) ON DELETE SET NULL,
  sla_due_at            TIMESTAMPTZ,
  escalation_level      INTEGER NOT NULL DEFAULT 1,
  status                VARCHAR(30) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN (
    'RECEIVED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','APPEALED','ESCALATED'
  )),
  resolved_at           TIMESTAMPTZ,
  resolution            TEXT,
  appeal_reason         TEXT,
  satisfaction_rating   INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_comment  TEXT,
  anonymous_access_pin  VARCHAR(20),
  complainant_name      VARCHAR(255),
  complainant_regd_no   VARCHAR(50),
  complainant_phone     VARCHAR(25),
  classifier_confidence REAL,
  classifier_keywords   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_grievances_status_sla ON grievances(status, sla_due_at);
CREATE INDEX IF NOT EXISTS idx_grievances_category ON grievances(category);
CREATE INDEX IF NOT EXISTS idx_grievances_dept ON grievances(department_id);
CREATE INDEX IF NOT EXISTS idx_grievances_student ON grievances(student_id);
CREATE INDEX IF NOT EXISTS idx_grievances_anon_pin ON grievances(grievance_no, anonymous_access_pin);
CREATE INDEX IF NOT EXISTS idx_grievances_complainant ON grievances(complainant_regd_no, complainant_phone);

-- ---------------------------------------------------------------------
-- 6. Grievance Audit Events (Immutable UGC Compliance Trail)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grievance_events (
  grievance_event_id TEXT PRIMARY KEY,
  grievance_id       TEXT NOT NULL REFERENCES grievances(grievance_id) ON DELETE CASCADE,
  occurred_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type         VARCHAR(50) NOT NULL CHECK (event_type IN (
    'SUBMITTED','ACKNOWLEDGED','ASSIGNED','REASSIGNED','COMMENT',
    'ESCALATED','RESOLVED','APPEALED','CLOSED','SATISFACTION_RATED'
  )),
  actor_user_id      TEXT REFERENCES users(user_id) ON DELETE SET NULL,
  actor_role         VARCHAR(100),
  notes              TEXT,
  metadata           TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_grievance_time ON grievance_events(grievance_id, occurred_at DESC);

-- ---------------------------------------------------------------------
-- 7. Statutory Escalation Log
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sla_escalations (
  escalation_id      TEXT PRIMARY KEY,
  grievance_id       TEXT NOT NULL REFERENCES grievances(grievance_id) ON DELETE CASCADE,
  breached_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  escalated_from     VARCHAR(100) NOT NULL,
  escalated_to       VARCHAR(100) NOT NULL,
  hours_overdue      REAL NOT NULL DEFAULT 0,
  reason             TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalations_grievance ON sla_escalations(grievance_id);

-- ---------------------------------------------------------------------
-- 8. Institutional Notifications
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  notification_id    TEXT PRIMARY KEY,
  grievance_id       TEXT REFERENCES grievances(grievance_id) ON DELETE CASCADE,
  recipient_user_id  TEXT,
  type               VARCHAR(50) NOT NULL,
  title              VARCHAR(255) NOT NULL,
  body               TEXT,
  channel            VARCHAR(50) DEFAULT 'IN_APP',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ---------------------------------------------------------------------
-- 9. AI Agent Audit Trail (AgentOps)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_runs (
  agent_run_id       TEXT PRIMARY KEY,
  agent_code         VARCHAR(50) NOT NULL DEFAULT 'A46_GRIEVANCE',
  trigger_type       VARCHAR(50) NOT NULL DEFAULT 'USER',
  grievance_id       TEXT REFERENCES grievances(grievance_id) ON DELETE SET NULL,
  action             VARCHAR(100) NOT NULL,
  input_data         TEXT,
  output_data        TEXT,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at        TIMESTAMPTZ,
  status             VARCHAR(30) NOT NULL DEFAULT 'SUCCEEDED'
);

-- =====================================================================
-- SEED DATA: Institutional Hierarchy & Statutory Entities
-- =====================================================================

-- Academic Departments
INSERT INTO departments (department_id, code, name) VALUES
  ('dept-cse', 'CSE', 'Computer Science & Engineering'),
  ('dept-ece', 'ECE', 'Electronics & Communication Engineering'),
  ('dept-mech', 'MECH', 'Mechanical Engineering'),
  ('dept-civil', 'CIVIL', 'Civil Engineering'),
  ('dept-eee', 'EEE', 'Electrical & Electronics Engineering'),
  ('dept-biotech', 'BIOTECH', 'Biotechnology & Bioinformatics'),
  ('dept-mgmt', 'MANAGEMENT', 'Vignan Institute of Management'),
  ('dept-pharmacy', 'PHARMACY', 'School of Pharmaceutical Sciences'),
  ('dept-law', 'LAW', 'School of Law & Legal Studies'),
  ('dept-general', 'GENERAL', 'Central University Administration')
ON CONFLICT (department_id) DO NOTHING;

-- Institutional Authorities
INSERT INTO users (user_id, username, full_name, email, role, department_id, is_active) VALUES
  ('user-hod-cse', 'hod_cse', 'Dr. K. Srinivasa Rao', 'hod_cse@vignan.ac.in', 'HOD', 'dept-cse', TRUE),
  ('user-hod-ece', 'hod_ece', 'Dr. N. Usha Rani', 'hod_ece@vignan.ac.in', 'HOD', 'dept-ece', TRUE),
  ('user-dean-student', 'dean_students', 'Prof. M. Ramesh Babu', 'dean_studentaffairs@vignan.ac.in', 'DEAN', 'dept-general', TRUE),
  ('user-anti-ragging-chair', 'chair_antirag', 'Prof. V. Radhika', 'antiragging@vignan.ac.in', 'COMMITTEE_CHAIR', 'dept-general', TRUE),
  ('user-admin', 'admin_central', 'Central Grievance Officer', 'grievance@vignan.ac.in', 'ADMIN', 'dept-general', TRUE)
ON CONFLICT (user_id) DO NOTHING;

-- Link Department Heads
UPDATE departments SET hod_user_id = 'user-hod-cse' WHERE department_id = 'dept-cse';
UPDATE departments SET hod_user_id = 'user-hod-ece' WHERE department_id = 'dept-ece';

-- Statutory Committees
INSERT INTO committees (committee_id, name, committee_type, is_statutory, mandate, status) VALUES
  ('comm-anti-ragging', 'Anti-Ragging Committee Squad', 'STATUTORY', TRUE, 'Enforce UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions, zero-tolerance rapid dispatch squad.', 'ACTIVE'),
  ('comm-icc', 'Internal Complaints Committee (ICC)', 'STATUTORY', TRUE, 'Redressal of sexual harassment and gender-based discrimination under PoSH Act 2013 and UGC Guidelines.', 'ACTIVE'),
  ('comm-eoc', 'Equal Opportunity Cell', 'STATUTORY', TRUE, 'Protection of SC/ST/OBC/differently-abled students against discrimination and institutional bias.', 'ACTIVE'),
  ('comm-appellate', 'Student Grievance Appeals Committee', 'ACADEMIC', FALSE, 'Executive appellate forum under Vice-Chancellor jurisdiction for escalated non-statutory disputes.', 'ACTIVE')
ON CONFLICT (committee_id) DO NOTHING;

-- Committee Memberships
INSERT INTO committee_members (committee_member_id, committee_id, user_id, member_role, from_date) VALUES
  ('cm-01', 'comm-anti-ragging', 'user-anti-ragging-chair', 'CHAIRPERSON', NOW()),
  ('cm-02', 'comm-anti-ragging', 'user-dean-student', 'CONVENER', NOW()),
  ('cm-03', 'comm-icc', 'user-dean-student', 'CONVENER', NOW())
ON CONFLICT (committee_member_id) DO NOTHING;

-- Students (Representative Cohort)
INSERT INTO users (user_id, username, full_name, email, role, department_id, is_active) VALUES
  ('student-001', '221FA04001', 'Akshay Gupta', '221fa04001@vignan.ac.in', 'STUDENT', 'dept-cse', TRUE),
  ('student-002', '221FA04002', 'Priya Sharma', '221fa04002@vignan.ac.in', 'STUDENT', 'dept-cse', TRUE),
  ('student-003', '221FA04003', 'Rahul Mehta', '221fa04003@vignan.ac.in', 'STUDENT', 'dept-ece', TRUE),
  ('student-004', '221FA04004', 'Sneha Reddy', '221fa04004@vignan.ac.in', 'STUDENT', 'dept-biotech', TRUE),
  ('student-005', '221FA04005', 'Vikram Kumar', '221fa04005@vignan.ac.in', 'STUDENT', 'dept-mech', TRUE)
ON CONFLICT (user_id) DO NOTHING;
