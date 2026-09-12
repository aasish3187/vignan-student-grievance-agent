// =====================================================================
// Database Configuration — Agent 46
// SQLite via node:sqlite (DatabaseSync). Schema mirrors PostgreSQL tables from
// 08_studentlife_placement_hr.sql and 09_governance_quality_knowledge.sql
// =====================================================================

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'grievance.db');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    if (!db.pragma) {
      db.pragma = (str) => db.exec(`PRAGMA ${str};`);
    }
  }
  return db;
}

function initSchema() {
  const conn = getDb();

  conn.exec(`
    -- ---------------------------------------------------------------
    -- core.department equivalent
    -- ---------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS departments (
      department_id   TEXT PRIMARY KEY,
      code            TEXT NOT NULL UNIQUE,
      name            TEXT NOT NULL,
      hod_user_id     TEXT
    );

    -- ---------------------------------------------------------------
    -- identity.app_user equivalent
    -- ---------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS users (
      user_id         TEXT PRIMARY KEY,
      username        TEXT NOT NULL UNIQUE,
      full_name       TEXT NOT NULL,
      email           TEXT,
      role            TEXT NOT NULL DEFAULT 'STUDENT',
      department_id   TEXT REFERENCES departments(department_id),
      is_active       INTEGER NOT NULL DEFAULT 1
    );

    -- ---------------------------------------------------------------
    -- governance.committee equivalent
    -- ---------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS committees (
      committee_id    TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      committee_type  TEXT CHECK (committee_type IN ('STATUTORY','ACADEMIC','ADMINISTRATIVE','ADVISORY','AD_HOC')),
      is_statutory    INTEGER NOT NULL DEFAULT 0,
      mandate         TEXT,
      status          TEXT NOT NULL DEFAULT 'ACTIVE'
    );

    -- ---------------------------------------------------------------
    -- governance.committee_member equivalent
    -- ---------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS committee_members (
      committee_member_id TEXT PRIMARY KEY,
      committee_id    TEXT NOT NULL REFERENCES committees(committee_id),
      user_id         TEXT REFERENCES users(user_id),
      member_role     TEXT NOT NULL CHECK (member_role IN ('CHAIRPERSON','CONVENER','MEMBER','MEMBER_SECRETARY','SPECIAL_INVITEE','STUDENT_REPRESENTATIVE')),
      from_date       TEXT NOT NULL
    );

    -- ---------------------------------------------------------------
    -- studentlife.grievance equivalent (exact column match)
    -- ---------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS grievances (
      grievance_id    TEXT PRIMARY KEY,
      grievance_no    TEXT NOT NULL UNIQUE,
      student_id      TEXT,
      is_anonymous    INTEGER NOT NULL DEFAULT 0,
      category        TEXT NOT NULL CHECK (category IN (
        'ACADEMIC','EXAMINATION','FEE','HOSTEL','TRANSPORT','INFRASTRUCTURE',
        'FACULTY_CONDUCT','HARASSMENT','DISCRIMINATION','RAGGING','SAFETY','OTHER'
      )),
      severity        TEXT NOT NULL DEFAULT 'NORMAL' CHECK (severity IN ('LOW','NORMAL','HIGH','CRITICAL')),
      is_statutory_route INTEGER NOT NULL DEFAULT 0,
      description     TEXT NOT NULL,
      department_id   TEXT REFERENCES departments(department_id),
      submitted_at    TEXT NOT NULL DEFAULT (datetime('now')),
      submitted_via   TEXT DEFAULT 'WEB',
      assigned_to_user_id TEXT REFERENCES users(user_id),
      assigned_to_role TEXT,
      committee_id    TEXT REFERENCES committees(committee_id),
      sla_due_at      TEXT,
      escalation_level INTEGER NOT NULL DEFAULT 1,
      status          TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN (
        'RECEIVED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','APPEALED','ESCALATED'
      )),
      resolved_at     TEXT,
      resolution      TEXT,
      appeal_reason   TEXT,
      satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
      satisfaction_comment TEXT,
      anonymous_access_pin TEXT,
      complainant_name TEXT,
      complainant_regd_no TEXT,
      complainant_phone TEXT,
      classifier_confidence REAL,
      classifier_keywords TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_grievance_status_sla ON grievances(status, sla_due_at);
    CREATE INDEX IF NOT EXISTS idx_grievance_category ON grievances(category);
    CREATE INDEX IF NOT EXISTS idx_grievance_dept ON grievances(department_id);
    CREATE INDEX IF NOT EXISTS idx_grievance_student ON grievances(student_id);

    -- ---------------------------------------------------------------
    -- studentlife.grievance_event equivalent
    -- ---------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS grievance_events (
      grievance_event_id TEXT PRIMARY KEY,
      grievance_id    TEXT NOT NULL REFERENCES grievances(grievance_id) ON DELETE CASCADE,
      occurred_at     TEXT NOT NULL DEFAULT (datetime('now')),
      event_type      TEXT NOT NULL CHECK (event_type IN (
        'SUBMITTED','ACKNOWLEDGED','ASSIGNED','REASSIGNED','COMMENT',
        'ESCALATED','RESOLVED','APPEALED','CLOSED','SATISFACTION_RATED'
      )),
      actor_user_id   TEXT REFERENCES users(user_id),
      actor_role      TEXT,
      notes           TEXT,
      metadata        TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_event_grievance ON grievance_events(grievance_id, occurred_at);

    -- ---------------------------------------------------------------
    -- Routing rules (configurable per institution)
    -- ---------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS routing_rules (
      rule_id         TEXT PRIMARY KEY,
      category        TEXT NOT NULL,
      department_id   TEXT REFERENCES departments(department_id),
      assigned_role   TEXT NOT NULL,
      assigned_user_id TEXT REFERENCES users(user_id),
      committee_id    TEXT REFERENCES committees(committee_id),
      priority        INTEGER NOT NULL DEFAULT 0
    );

    -- ---------------------------------------------------------------
    -- Notifications log
    -- ---------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id TEXT PRIMARY KEY,
      grievance_id    TEXT REFERENCES grievances(grievance_id),
      recipient_user_id TEXT,
      type            TEXT NOT NULL,
      title           TEXT NOT NULL,
      body            TEXT,
      channel         TEXT DEFAULT 'IN_APP',
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      read_at         TEXT
    );

    -- ---------------------------------------------------------------
    -- agentops.agent_run equivalent (audit trail for agent actions)
    -- ---------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS agent_runs (
      agent_run_id    TEXT PRIMARY KEY,
      agent_code      TEXT NOT NULL DEFAULT 'A46_GRIEVANCE',
      trigger_type    TEXT NOT NULL DEFAULT 'USER',
      grievance_id    TEXT REFERENCES grievances(grievance_id),
      action          TEXT NOT NULL,
      input_data      TEXT,
      output_data     TEXT,
      started_at      TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at     TEXT,
      status          TEXT NOT NULL DEFAULT 'SUCCEEDED'
    );
  `);

  try {
    conn.exec('ALTER TABLE grievances ADD COLUMN anonymous_access_pin TEXT;');
  } catch (e) {
    // Column already exists
  }

  try {
    conn.exec('CREATE INDEX IF NOT EXISTS idx_grievance_anon_pin ON grievances(grievance_no, anonymous_access_pin);');
  } catch (e) {
    // Index already exists
  }

  // Safe migration for student identification fields (No-Login Intake)
  try {
    conn.exec('ALTER TABLE grievances ADD COLUMN complainant_name TEXT;');
  } catch (e) {}

  try {
    conn.exec('ALTER TABLE grievances ADD COLUMN complainant_regd_no TEXT;');
  } catch (e) {}

  try {
    conn.exec('ALTER TABLE grievances ADD COLUMN complainant_phone TEXT;');
  } catch (e) {}

  try {
    conn.exec('CREATE INDEX IF NOT EXISTS idx_grievance_complainant_lookup ON grievances(complainant_regd_no, complainant_phone);');
  } catch (e) {}

  // Safe backfill for pre-seeded student complaints
  try {
    conn.exec(`
      UPDATE grievances SET complainant_name = 'Akshay Gupta', complainant_regd_no = '221FA04001', complainant_phone = '9876543211' WHERE student_id = 'student-001' AND complainant_regd_no IS NULL;
      UPDATE grievances SET complainant_name = 'Priya Sharma', complainant_regd_no = '221FA04002', complainant_phone = '9876543212' WHERE student_id = 'student-002' AND complainant_regd_no IS NULL;
      UPDATE grievances SET complainant_name = 'Rahul Mehta', complainant_regd_no = '221FA04003', complainant_phone = '9876543213' WHERE student_id = 'student-003' AND complainant_regd_no IS NULL;
      UPDATE grievances SET complainant_name = 'Sneha Reddy', complainant_regd_no = '221FA04004', complainant_phone = '9876543214' WHERE student_id = 'student-004' AND complainant_regd_no IS NULL;
      UPDATE grievances SET complainant_name = 'Vikram Kumar', complainant_regd_no = '221FA04005', complainant_phone = '9876543215' WHERE student_id = 'student-005' AND complainant_regd_no IS NULL;
    `);
  } catch (e) {}

  return conn;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initSchema, closeDb };
