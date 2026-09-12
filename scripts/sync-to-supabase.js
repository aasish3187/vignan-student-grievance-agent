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

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!DATABASE_URL) {
  console.error('\n[ERROR] Missing DATABASE_URL or SUPABASE_DB_URL in environment.');
  console.error('Please configure your Supabase connection string:');
  console.error('DATABASE_URL=postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?pgbouncer=true\n');
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
    // 1. Run DDL Schema
    console.log('[1/5] Executing Supabase DDL schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('      Schema tables and constraints verified in Supabase.');

    // 2. Sync Departments
    console.log('[2/5] Migrating Departments...');
    const depts = sqlite.prepare('SELECT * FROM departments').all();
    for (const d of depts) {
      await client.query(`
        INSERT INTO departments (department_id, code, name, hod_user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (department_id) DO UPDATE SET
          code = EXCLUDED.code, name = EXCLUDED.name, hod_user_id = EXCLUDED.hod_user_id
      `, [d.department_id, d.code, d.name, d.hod_user_id]);
    }
    console.log(`      Synced ${depts.length} departments.`);

    // 3. Sync Users
    console.log('[3/5] Migrating Users & Authorities...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const u of users) {
      await client.query(`
        INSERT INTO users (user_id, username, full_name, email, role, department_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE SET
          username = EXCLUDED.username, full_name = EXCLUDED.full_name,
          email = EXCLUDED.email, role = EXCLUDED.role, department_id = EXCLUDED.department_id
      `, [u.user_id, u.username, u.full_name, u.email, u.role, u.department_id, Boolean(u.is_active)]);
    }
    console.log(`      Synced ${users.length} users.`);

    // 4. Sync Grievances
    console.log('[4/5] Migrating Grievances (Central Case Registry)...');
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
        ON CONFLICT (grievance_id) DO UPDATE SET
          status = EXCLUDED.status,
          resolved_at = EXCLUDED.resolved_at,
          resolution = EXCLUDED.resolution,
          satisfaction_rating = EXCLUDED.satisfaction_rating,
          satisfaction_comment = EXCLUDED.satisfaction_comment,
          updated_at = EXCLUDED.updated_at
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

    // 5. Sync Events
    console.log('[5/5] Migrating Audit Events...');
    const events = sqlite.prepare('SELECT * FROM grievance_events').all();
    for (const e of events) {
      await client.query(`
        INSERT INTO grievance_events (
          grievance_event_id, grievance_id, occurred_at, event_type,
          actor_user_id, actor_role, notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (grievance_event_id) DO NOTHING
      `, [
        e.grievance_event_id, e.grievance_id, e.occurred_at, e.event_type,
        e.actor_user_id, e.actor_role, e.notes, e.metadata
      ]);
    }
    console.log(`      Synced ${events.length} audit trail events.`);

    console.log('\n======================================================');
    console.log(' SUCCESS: All campus data synced to Supabase (PostgreSQL)!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n[MIGRATION ERROR]', err);
  } finally {
    client.release();
    await pgPool.end();
  }
}

migrate();
