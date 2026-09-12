// =====================================================================
// Analytics Service — Agent 46: Student Grievance System
// Role-Based Jurisdictional Scoping & Systemic Insights
// Strictly Scoped to Institutional Authority Mandates
// Vignan University — Agentic AI Day 2026
// =====================================================================

const { getDb } = require('../config/database');

/**
 * Builds an SQL WHERE clause fragment and parameter list based on user's role and institutional jurisdiction.
 * @param {Object} user - { id, role, deptCode, committee }
 * @param {string} tableAlias - e.g. 'g' or ''
 * @returns {Object} { clause: string, params: Array }
 */
function buildScopeClause(user, tableAlias = '') {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  if (!user || user.role === 'ADMIN') {
    return { clause: '', params: [] };
  }

  const userId = (user.id || '').toLowerCase();
  const role = (user.role || '').toUpperCase();

  // 1. Anti-Ragging and Student Committee (Gets ONLY their required statutory cases)
  if (userId === 'antirag-chair' || (role === 'COMMITTEE_MEMBER' && user.committee && user.committee.includes('Anti-Ragging')) || userId === 'icc-chair') {
    return {
      clause: ` AND (${prefix}category IN ('RAGGING', 'HARASSMENT', 'DISCRIMINATION', 'SAFETY') OR ${prefix}assigned_to_role = 'ANTI_RAGGING_COMMITTEE')`,
      params: []
    };
  }

  // 2. Department Heads (Gets full complaints given by/for their department)
  if (role === 'HOD' && user.deptCode) {
    return {
      clause: ` AND ${prefix}department_id = ?`,
      params: [user.deptCode]
    };
  }

  // 3. Grievance Committee / Central Administration (Can get ALL the complaints filed across the institution)
  if (userId === 'dean-student' || role === 'DEAN_STUDENT_AFFAIRS' || role === 'GRIEVANCE_COMMITTEE' || role === 'GRIEVANCE_CELL' || (user.committee && user.committee.includes('Grievance'))) {
    return {
      clause: '',
      params: []
    };
  }

  // 4. Dean of Academic Affairs (Academic, Examination & Faculty Conduct)
  if (userId === 'dean-academics' || role === 'DEAN') {
    return {
      clause: ` AND (${prefix}category IN ('ACADEMIC', 'EXAMINATION', 'FACULTY_CONDUCT') OR ${prefix}assigned_to_role IN ('DEAN_ACADEMICS', 'HOD'))`,
      params: []
    };
  }

  // 5. Controller of Examinations (COE)
  if (role === 'COE' || userId === 'coe') {
    return {
      clause: ` AND (${prefix}category IN ('EXAMINATION', 'ACADEMIC') OR ${prefix}assigned_to_role IN ('COE', 'HOD'))`,
      params: []
    };
  }

  // 7. Verified Students (Personal Grievance Scope Only)
  if (role === 'STUDENT' && user.id) {
    return {
      clause: ` AND ${prefix}student_id = ?`,
      params: [user.id]
    };
  }

  return { clause: '', params: [] };
}

/**
 * Dashboard KPI summary (scoped by authority).
 */
function getDashboardStats(user) {
  const db = getDb();
  const scope = buildScopeClause(user);

  const total = db.prepare(`SELECT COUNT(*) as count FROM grievances WHERE 1=1 ${scope.clause}`).get(...scope.params).count;
  const open = db.prepare(`SELECT COUNT(*) as count FROM grievances WHERE status IN ('RECEIVED','ASSIGNED','IN_PROGRESS','ESCALATED','APPEALED') ${scope.clause}`).get(...scope.params).count;
  const resolved = db.prepare(`SELECT COUNT(*) as count FROM grievances WHERE status IN ('RESOLVED','CLOSED') ${scope.clause}`).get(...scope.params).count;
  const escalated = db.prepare(`SELECT COUNT(*) as count FROM grievances WHERE escalation_level > 1 ${scope.clause}`).get(...scope.params).count;
  const statutory = db.prepare(`SELECT COUNT(*) as count FROM grievances WHERE is_statutory_route = 1 ${scope.clause}`).get(...scope.params).count;

  const avgResolutionTime = db.prepare(`
    SELECT ROUND(AVG(
      (julianday(resolved_at) - julianday(submitted_at)) * 24
    ), 1) as avg_hours
    FROM grievances WHERE resolved_at IS NOT NULL ${scope.clause}
  `).get(...scope.params).avg_hours || 0;

  const slaBreached = db.prepare(`
    SELECT COUNT(*) as count FROM grievances
    WHERE sla_due_at IS NOT NULL
      AND resolved_at IS NOT NULL
      AND resolved_at > sla_due_at
      ${scope.clause}
  `).get(...scope.params).count;

  const slaOnTime = resolved - slaBreached;
  const slaComplianceRate = resolved > 0 ? Math.round((slaOnTime / resolved) * 100) : 100;

  const avgSatisfaction = db.prepare(`
    SELECT ROUND(AVG(satisfaction_rating), 1) as avg_rating
    FROM grievances WHERE satisfaction_rating IS NOT NULL ${scope.clause}
  `).get(...scope.params).avg_rating || 0;

  const pendingSLA = db.prepare(`
    SELECT COUNT(*) as count FROM grievances
    WHERE status IN ('ASSIGNED','IN_PROGRESS')
      AND sla_due_at IS NOT NULL
      AND sla_due_at < datetime('now')
      ${scope.clause}
  `).get(...scope.params).count;

  return {
    total, open, resolved, escalated, statutory,
    avgResolutionTimeHours: avgResolutionTime,
    slaComplianceRate, slaBreached, slaOnTime, pendingSLA,
    avgSatisfaction,
    jurisdiction: {
      title: user?.title || 'Central Grievance Administrator',
      role: user?.role || 'ADMIN',
      badge: user?.badge || 'SYSTEM ADMIN',
      department: user?.department || 'Central Grievance Redressal Cell',
      scopeDescription: user?.scopeDescription || 'University-Wide Jurisdiction'
    }
  };
}

/**
 * Detect systemic patterns — scoped to the officer's mandate.
 */
function detectPatterns(user) {
  const db = getDb();
  const scope = buildScopeClause(user);
  const scopeG = buildScopeClause(user, 'g');

  const totalCount = db.prepare(`SELECT COUNT(*) as count FROM grievances WHERE 1=1 ${scope.clause}`).get(...scope.params).count;
  const divisor = totalCount > 0 ? totalCount : 1;

  // Category distribution
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / ${divisor}, 1) as pct
    FROM grievances
    WHERE 1=1 ${scope.clause}
    GROUP BY category ORDER BY count DESC
  `).all(...scope.params);

  // Department hotspots
  const byDepartment = db.prepare(`
    SELECT d.name as department, g.category, COUNT(*) as count
    FROM grievances g
    LEFT JOIN departments d ON g.department_id = d.department_id
    WHERE d.name IS NOT NULL ${scopeG.clause}
    GROUP BY d.name, g.category
    HAVING count >= 1
    ORDER BY count DESC
  `).all(...scopeG.params);

  // Monthly trends
  const monthlyTrends = db.prepare(`
    SELECT strftime('%Y-%m', submitted_at) as month, COUNT(*) as count
    FROM grievances
    WHERE 1=1 ${scope.clause}
    GROUP BY month ORDER BY month
  `).all(...scope.params);

  // Systemic alerts
  const alerts = [];
  for (const cat of byCategory) {
    if (cat.count >= 2 || cat.pct >= 30) {
      alerts.push({
        type: 'HIGH_VOLUME',
        severity: cat.pct >= 40 ? 'CRITICAL' : 'WARNING',
        message: `${cat.category} accounts for ${cat.pct}% of active jurisdiction caseload (${cat.count} cases)`,
        category: cat.category,
        count: cat.count,
        percentage: cat.pct
      });
    }
  }

  for (const item of byDepartment) {
    if (item.count >= 2) {
      alerts.push({
        type: 'DEPT_CONCENTRATION',
        severity: item.count >= 5 ? 'CRITICAL' : 'WARNING',
        message: `${item.count} ${item.category} complaints registered under ${item.department}`,
        department: item.department,
        category: item.category,
        count: item.count
      });
    }
  }

  return { byCategory, byDepartment, monthlyTrends, alerts };
}

/**
 * SLA compliance breakdown (scoped).
 */
function getSlaCompliance(user) {
  const db = getDb();
  const scope = buildScopeClause(user);

  const byCategory = db.prepare(`
    SELECT category,
      COUNT(*) as total,
      SUM(CASE WHEN resolved_at IS NOT NULL AND resolved_at <= sla_due_at THEN 1 ELSE 0 END) as on_time,
      SUM(CASE WHEN resolved_at IS NOT NULL AND resolved_at > sla_due_at THEN 1 ELSE 0 END) as breached,
      SUM(CASE WHEN resolved_at IS NULL AND sla_due_at < datetime('now') THEN 1 ELSE 0 END) as currently_breached
    FROM grievances
    WHERE sla_due_at IS NOT NULL ${scope.clause}
    GROUP BY category
  `).all(...scope.params);

  const byAuthority = db.prepare(`
    SELECT assigned_to_role,
      COUNT(*) as total,
      SUM(CASE WHEN resolved_at IS NOT NULL AND resolved_at <= sla_due_at THEN 1 ELSE 0 END) as on_time,
      SUM(CASE WHEN resolved_at IS NOT NULL AND resolved_at > sla_due_at THEN 1 ELSE 0 END) as breached
    FROM grievances
    WHERE sla_due_at IS NOT NULL ${scope.clause}
    GROUP BY assigned_to_role
  `).all(...scope.params);

  return { byCategory, byAuthority };
}

/**
 * Satisfaction analysis (scoped).
 */
function getSatisfactionReport(user) {
  const db = getDb();
  const scope = buildScopeClause(user);

  const distribution = db.prepare(`
    SELECT satisfaction_rating as rating, COUNT(*) as count
    FROM grievances
    WHERE satisfaction_rating IS NOT NULL ${scope.clause}
    GROUP BY satisfaction_rating
    ORDER BY satisfaction_rating
  `).all(...scope.params);

  const byCategory = db.prepare(`
    SELECT category, ROUND(AVG(satisfaction_rating), 1) as avg_rating, COUNT(*) as responses
    FROM grievances
    WHERE satisfaction_rating IS NOT NULL ${scope.clause}
    GROUP BY category ORDER BY avg_rating ASC
  `).all(...scope.params);

  const genuinelyResolved = db.prepare(`
    SELECT COUNT(*) as count FROM grievances
    WHERE satisfaction_rating >= 4 ${scope.clause}
  `).get(...scope.params).count;

  const merelyClosedCount = db.prepare(`
    SELECT COUNT(*) as count FROM grievances
    WHERE satisfaction_rating IS NOT NULL AND satisfaction_rating < 3 ${scope.clause}
  `).get(...scope.params).count;

  return { distribution, byCategory, genuinelyResolved, merelyClosed: merelyClosedCount };
}

/**
 * Heatmap data: department × category matrix (scoped).
 */
function getHeatmap(user) {
  const db = getDb();
  const scopeG = buildScopeClause(user, 'g');

  return db.prepare(`
    SELECT d.code as dept_code, d.name as dept_name, g.category, COUNT(*) as count
    FROM grievances g
    LEFT JOIN departments d ON g.department_id = d.department_id
    WHERE 1=1 ${scopeG.clause}
    GROUP BY d.code, g.category
    ORDER BY d.code, g.category
  `).all(...scopeG.params);
}

module.exports = {
  buildScopeClause,
  getDashboardStats,
  detectPatterns,
  getSlaCompliance,
  getSatisfactionReport,
  getHeatmap
};
