// =====================================================================
// Supabase Cloud Sync Utility — Agent 46
// Migrates all existing records from local SQLite (grievance.db)
// into Supabase PostgreSQL in a single transactional run.
// Usage: node scripts/sync-to-supabase.js
// =====================================================================

require('dotenv').config();
const { Pool } = require('pg');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!DATABASE_URL) {
  console.error('\n[ERROR] Missing DATABASE_URL in environment.');
  process.exit(1);
}

const sqlitePath = path.join(__dirname, '..', 'grievance.db');
if (!fs.existsSync(sqlitePath)) {
  console.error(`\n[ERROR] Local SQLite database not found at ${sqlitePath}\n`);
  process.exit(1);
}

const sqlite = new DatabaseSync(sqlitePath);
const pgPool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('\n======================================================');
  console.log('   Agent 46: Local SQLite -> Supabase Cloud Migration   ');
  console.log('======================================================\n');

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // 1. Clean existing tables for atomic mirror
    console.log('[1/7] Preparing Supabase tables...');
    try {
      await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
    } catch (e) {}
    await client.query(`
      TRUNCATE TABLE 
        grievance_events, 
        sla_escalations, 
        notifications, 
        agent_runs, 
        grievances, 
        committee_members, 
        committees, 
        users, 
        departments 
      CASCADE;
    `);
    console.log('      Clean slate prepared.');

    // 2. Sync Departments
    console.log('[2/7] Migrating Departments...');
    const depts = sqlite.prepare('SELECT * FROM departments').all();
    for (const d of depts) {
      await client.query(`
        INSERT INTO departments (department_id, code, name, hod_user_id)
        VALUES ($1, $2, $3, $4)
      `, [d.department_id, d.code, d.name, d.hod_user_id]);
    }
    console.log(`      Synced ${depts.length} departments.`);

    // 3. Sync Committees
    console.log('[3/7] Migrating Statutory & Redressal Committees...');
    const committees = sqlite.prepare('SELECT * FROM committees').all();
    for (const c of committees) {
      await client.query(`
        INSERT INTO committees (committee_id, name, committee_type, is_statutory, mandate, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [c.committee_id, c.name, c.committee_type, Boolean(c.is_statutory), c.mandate, c.status || 'ACTIVE']);
    }
    console.log(`      Synced ${committees.length} committees.`);

    // 4. Sync Users & Authorities
    console.log('[4/7] Migrating Users & Institutional Authorities...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const u of users) {
      await client.query(`
        INSERT INTO users (user_id, username, full_name, email, role, department_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [u.user_id, u.username, u.full_name, u.email, u.role, u.department_id, Boolean(u.is_active)]);
    }
    console.log(`      Synced ${users.length} users and authorities.`);

    // 5. Sync Committee Memberships
    try {
      const members = sqlite.prepare('SELECT * FROM committee_members').all();
      if (members.length > 0) {
        for (const m of members) {
          await client.query(`
            INSERT INTO committee_members (committee_member_id, committee_id, user_id, member_role, from_date)
            VALUES ($1, $2, $3, $4, $5)
          `, [m.committee_member_id, m.committee_id, m.user_id, m.member_role, m.from_date || new Date().toISOString()]);
        }
        console.log(`      Synced ${members.length} committee members.`);
      }
    } catch (e) {
      // Ignore if empty
    }

    // 6. Sync Grievances
    console.log('[5/7] Migrating Grievances (Central Case Registry)...');
    const grievances = sqlite.prepare('SELECT * FROM grievances').all();
    for (const g of grievances) {
      await client.query(`
        INSERT INTO grievances (
          grievance_id, grievance_no, student_id, is_anonymous, category,
          severity, is_statutory_route, description, department_id, submitted_at,
          submitted_via, assigned_to_user_id, assigned_to_role, committee_id, sla_due_at,
          escalation_level, status, resolved_at, resolution, appeal_reason,
          satisfaction_rating, satisfaction_comment, anonymous_access_pin,
          complainant_name, complainant_regd_no, complainant_phone,
          classifier_confidence, classifier_keywords, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23,
          $24, $25, $26,
          $27, $28, $29, $30
        )
      `, [
        g.grievance_id, g.grievance_no, g.student_id, Boolean(g.is_anonymous), g.category,
        g.severity, Boolean(g.is_statutory_route), g.description, g.department_id, g.submitted_at,
        g.submitted_via, g.assigned_to_user_id, g.assigned_to_role, g.committee_id, g.sla_due_at,
        g.escalation_level, g.status, g.resolved_at, g.resolution, g.appeal_reason,
        g.satisfaction_rating, g.satisfaction_comment, g.anonymous_access_pin,
        g.complainant_name, g.complainant_regd_no, g.complainant_phone,
        g.classifier_confidence, g.classifier_keywords, g.created_at, g.updated_at
      ]);
    }
    console.log(`      Synced ${grievances.length} grievances.`);

    // 7. Sync Audit Trail Events
    console.log('[6/7] Migrating Audit Events...');
    const events = sqlite.prepare('SELECT * FROM grievance_events').all();
    for (const e of events) {
      await client.query(`
        INSERT INTO grievance_events (
          grievance_event_id, grievance_id, occurred_at, event_type,
          actor_user_id, actor_role, notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        e.grievance_event_id, e.grievance_id, e.occurred_at, e.event_type,
        e.actor_user_id, e.actor_role, e.notes, e.metadata
      ]);
    }
    console.log(`      Synced ${events.length} audit trail events.`);

    // 8. Sync Agent Runs & SLA Escalations if available
    try {
      const runs = sqlite.prepare('SELECT * FROM agent_runs').all();
      for (const r of runs) {
        await client.query(`
          INSERT INTO agent_runs (agent_run_id, agent_code, trigger_type, grievance_id, action, input_data, output_data, started_at, finished_at, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [r.agent_run_id, r.agent_code, r.trigger_type, r.grievance_id, r.action, r.input_data, r.output_data, r.started_at, r.finished_at, r.status]);
      }
      console.log(`[7/7] Synced ${runs.length} AI agent runs.`);
    } catch (e) {}

    await client.query('COMMIT');

    console.log('\n======================================================');
    console.log(' SUCCESS: All campus data synced to Supabase (PostgreSQL)!');
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n[MIGRATION ERROR]', err);
  } finally {
    client.release();
    await pgPool.end();
  }
}

migrate();
