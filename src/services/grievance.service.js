// =====================================================================
// Grievance Service — Agent 46
// Orchestrates the full grievance lifecycle:
// Submit → Classify → Route → Persist → Acknowledge
// Resolve → Appeal → Satisfaction → Close
// =====================================================================

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { classify } = require('../core/classifier');
const { route } = require('../core/router');
const { calculateDeadline } = require('../core/sla-engine');
const { sanitizeForStorage } = require('../core/anonymizer');
const { processMultilingualText } = require('../core/translator');
const notificationService = require('./notification.service');
const dispatchService = require('./dispatch.service');
const { buildScopeClause } = require('./analytics.service');

// Generate human-readable grievance number: GRV-2026-XXXXX
function generateGrievanceNo() {
  const year = new Date().getFullYear();
  const seq = Math.floor(10000 + Math.random() * 90000);
  return `GRV-${year}-${seq}`;
}

/**
 * Submit a new grievance — full intake orchestration.
 */
function submitGrievance(data) {
  const db = getDb();
  const grievanceId = uuidv4();
  const grievanceNo = generateGrievanceNo();

  // Step 1: Handle anonymity
  let processedData = { ...data };
  if (data.is_anonymous) {
    processedData = sanitizeForStorage(processedData);
  }

  // Step 1.5: Multilingual Vernacular Analysis (Telugu & English)
  const langResult = processMultilingualText(processedData.description);
  const textForClassifier = langResult.isVernacular ? langResult.translatedText : processedData.description;
  const originalTranscript = langResult.isVernacular ? langResult.originalText : null;

  // Step 2: Classify
  const classification = classify(textForClassifier, processedData.category);

  // Step 2.5: Automated Semantic Duplicate Detection & Merging (Prevents Spam Flooding)
  const studentRegd = (processedData.complainant_regd_no || '').trim().toUpperCase();
  const studentPhone = (processedData.complainant_phone || '').trim();

  if (studentRegd || studentPhone) {
    const recentDuplicate = db.prepare(`
      SELECT grievance_id, grievance_no, description, status, submitted_at
      FROM grievances
      WHERE (
        (complainant_regd_no = ? AND complainant_regd_no IS NOT NULL AND complainant_regd_no != '')
        OR (complainant_phone = ? AND complainant_phone IS NOT NULL AND complainant_phone != '')
      )
      AND category = ?
      AND status IN ('RECEIVED', 'ASSIGNED', 'IN_PROGRESS')
      AND datetime(submitted_at) >= datetime('now', '-48 hours')
      ORDER BY submitted_at DESC
      LIMIT 1
    `).get(studentRegd, studentPhone, classification.category);

    if (recentDuplicate) {
      // Calculate lexical/token similarity between new description and existing grievance
      const newTokens = new Set(processedData.description.toLowerCase().match(/\b\w{3,}\b/g) || []);
      const oldTokens = new Set((recentDuplicate.description || '').toLowerCase().match(/\b\w{3,}\b/g) || []);
      let matchCount = 0;
      for (const t of newTokens) {
        if (oldTokens.has(t)) matchCount++;
      }
      const similarity = newTokens.size > 0 ? (matchCount / newTokens.size) : 0;

      // If token overlap > 40% or exact category re-submission within 48h
      if (similarity >= 0.35 || matchCount >= 4) {
        const updateNote = `[SUPPLEMENTAL CITIZEN UPDATE - ${new Date().toLocaleTimeString()}]: "${processedData.description}"` + (processedData.attachment_name ? ` [Evidence Added: ${processedData.attachment_name}]` : '');
        
        // Append update to existing grievance problem statement
        db.prepare(`
          UPDATE grievances 
          SET description = description || '\n\n' || ?
          WHERE grievance_id = ?
        `).run(updateNote, recentDuplicate.grievance_id);

        // Record audit event
        addEvent(db, recentDuplicate.grievance_id, 'REMARKS_ADDED', null, 'STUDENT',
          `Automated Duplicate Prevention Engine: Repeated submission within 48h merged into active docket. Additional notes: "${processedData.description.substring(0, 80)}..."`);

        console.log(`[DUPLICATE MERGE] Repetitive grievance merged into active case ${recentDuplicate.grievance_no}`);

        return {
          isDuplicateMerged: true,
          grievanceId: recentDuplicate.grievance_id,
          grievanceNo: recentDuplicate.grievance_no,
          status: recentDuplicate.status,
          message: `Notice: You already have an active grievance [${recentDuplicate.grievance_no}] under official investigation for ${classification.category}. To prevent administrative duplication, your additional details have been merged into your active case docket.`,
          classification,
          routing: route(classification, processedData.department_id)
        };
      }
    }
  }

  // Step 3: Route
  const routing = route(classification, processedData.department_id);

  // Step 4: Calculate SLA deadline
  const submittedAt = new Date().toISOString();
  const slaDueAt = calculateDeadline(classification.category, submittedAt);

  // Step 5: Resolve foreign keys safely
  let deptId = processedData.department_id || null;
  if (deptId) {
    const dept = db.prepare('SELECT department_id FROM departments WHERE department_id = ? OR code = ?').get(deptId, deptId);
    deptId = dept ? dept.department_id : null;
  }

  let commId = routing.committee || null;
  if (commId) {
    const comm = db.prepare('SELECT committee_id FROM committees WHERE committee_id = ?').get(commId);
    commId = comm ? comm.committee_id : null;
  }

  let studentId = processedData.student_id || null;
  if (studentId) {
    const validStudent = db.prepare('SELECT user_id FROM users WHERE user_id = ?').get(studentId);
    studentId = validStudent ? validStudent.user_id : null;
  }

  const isAnonymous = Boolean(processedData.is_anonymous);
  const complainantName = isAnonymous ? null : ((processedData.complainant_name || '').trim() || null);
  const complainantRegdNo = isAnonymous ? null : ((processedData.complainant_regd_no || '').trim().toUpperCase() || null);
  const complainantPhone = isAnonymous ? null : ((processedData.complainant_phone || '').trim() || null);
  const anonymousPin = isAnonymous ? Math.floor(100000 + Math.random() * 900000).toString() : null;

  // Extract attachment payload if provided
  const attachmentName = processedData.attachment_name || null;
  const attachmentType = processedData.attachment_type || null;
  const attachmentData = processedData.attachment_data || null;

  // Persist grievance with attachments & multilingual columns
  const stmt = db.prepare(`
    INSERT INTO grievances (
      grievance_id, grievance_no, student_id, is_anonymous,
      complainant_name, complainant_regd_no, complainant_phone,
      category, severity, is_statutory_route, description,
      department_id, submitted_at, submitted_via,
      assigned_to_role, committee_id, sla_due_at,
      escalation_level, status,
      anonymous_access_pin,
      classifier_confidence, classifier_keywords,
      attachment_name, attachment_type, attachment_data,
      original_transcript
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    grievanceId, grievanceNo,
    processedData.student_id || null,
    isAnonymous ? 1 : 0,
    complainantName,
    complainantRegdNo,
    complainantPhone,
    classification.category,
    classification.severity,
    classification.isStatutoryRoute ? 1 : 0,
    processedData.description,
    deptId,
    submittedAt,
    processedData.submitted_via || 'WEB',
    routing.assignedRole,
    commId,
    slaDueAt,
    1,
    'RECEIVED',
    anonymousPin,
    classification.confidence,
    JSON.stringify(classification.keywords),
    attachmentName,
    attachmentType,
    attachmentData,
    originalTranscript
  );

  // Step 6: Create SUBMITTED event
  addEvent(db, grievanceId, 'SUBMITTED', null, null, 'Grievance submitted via ' + (processedData.submitted_via || 'WEB') + (isAnonymous ? ' [Anonymous Whistleblower Mode]' : ` [Student: ${complainantName || 'Identified'} (${complainantRegdNo || 'Verified'})]`) + (attachmentName ? ` [Attached Evidence: ${attachmentName}]` : '') + (langResult.isVernacular ? ' [Vernacular Telugu Transcript Processed]' : ''));

  // Step 7: Create ACKNOWLEDGED event
  addEvent(db, grievanceId, 'ACKNOWLEDGED', null, 'SYSTEM',
    `Assigned to ${routing.description}. SLA deadline: ${new Date(slaDueAt).toLocaleString()}` +
    (classification.isStatutoryRoute ? ' [STATUTORY BYPASS — Direct routing to committee]' : ''));

  // Step 8: Auto-assign status
  db.prepare('UPDATE grievances SET status = ? WHERE grievance_id = ?')
    .run('ASSIGNED', grievanceId);

  // Step 9: Multi-channel WhatsApp / SMS Dispatch
  let intakeDispatch = null;
  try {
    if (!isAnonymous && complainantPhone) {
      intakeDispatch = dispatchService.sendIntakeNotice({
        grievanceNo,
        category: classification.category,
        studentName: complainantName,
        studentPhone: complainantPhone,
        assignedTo: routing.description
      });
    }

    // Emergency Anti-Ragging Flying Squad SOS Alert
    if (classification.category === 'RAGGING' || classification.severity === 'CRITICAL' || classification.category === 'HARASSMENT') {
      dispatchService.sendEmergencySOS({
        grievanceNo,
        category: classification.category,
        description: processedData.description
      });
    }
  } catch (err) {
    console.error('[DISPATCH ERROR]', err);
  }
  addEvent(db, grievanceId, 'ASSIGNED', null, 'SYSTEM',
    `Routed to ${routing.assignedRole}` + (routing.committee ? ` (${routing.committee})` : ''));

  // Step 9: Log agent run
  logAgentRun(db, grievanceId, 'CLASSIFY_AND_ROUTE', {
    classification, routing
  });

  // Step 10: Generate notification
  const notification = notificationService.acknowledge({
    grievanceId, grievanceNo, slaDueAt,
    category: classification.category,
    assignedTo: routing.description,
    isStatutory: classification.isStatutoryRoute
  });

  return {
    grievanceId,
    grievanceNo,
    classification,
    routing,
    slaDueAt,
    notification,
    status: 'ASSIGNED',
    isAnonymous,
    anonymousPin,
    whatsappUrl: intakeDispatch?.whatsappUrl || null
  };
}

/**
 * Retrieve anonymous grievance verifying 6-digit Secret PIN.
 */
function getAnonymousGrievance(grievanceNo, pin) {
  const db = getDb();
  const cleanNo = (grievanceNo || '').trim().toUpperCase();
  const cleanPin = (pin || '').trim();

  const g = db.prepare('SELECT * FROM grievances WHERE UPPER(grievance_no) = ?').get(cleanNo);
  if (!g) {
    throw new Error('Grievance reference number not found in university records');
  }

  // If case has a secret pin, check it
  if (g.anonymous_access_pin && g.anonymous_access_pin !== cleanPin) {
    throw new Error('Invalid Secret PIN. Please verify the 6-digit Anonymous Tracking PIN provided at submission.');
  }

  return getGrievance(g.grievance_id);
}

/**
 * Retrieve grievances submitted by a student matching their Registration No and Phone Number.
 * Strict privacy enforcement: Students only see complaints matching their credentials.
 */
function getStudentGrievances(regdNo, phone) {
  const db = getDb();
  const cleanRegd = (regdNo || '').trim().toUpperCase();
  const rawDigits = (phone || '').replace(/\D/g, '');
  const last10Digits = rawDigits.slice(-10);

  if (!cleanRegd || !last10Digits || last10Digits.length < 10) {
    throw new Error('Valid registration number and 10-digit mobile number are required.');
  }

  const query = `
    SELECT g.*,
           COALESCE(u.full_name, g.complainant_name, 'Student') as student_name,
           COALESCE(u.username, g.complainant_regd_no) as student_regd_no,
           COALESCE(g.complainant_phone, '') as student_phone,
           d.name as department_name,
           d.code as department_code,
           c.name as committee_name
    FROM grievances g
    LEFT JOIN users u ON g.student_id = u.user_id
    LEFT JOIN departments d ON g.department_id = d.department_id
    LEFT JOIN committees c ON g.committee_id = c.committee_id
    WHERE g.is_anonymous = 0
      AND (
        (
          UPPER(TRIM(COALESCE(g.complainant_regd_no, ''))) = ?
          AND REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(g.complainant_phone, ''), ' ', ''), '-', ''), '+91', ''), '+', '') LIKE ?
        )
        OR
        (
          UPPER(TRIM(COALESCE(u.username, ''))) = ?
          AND REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(g.complainant_phone, ''), ' ', ''), '-', ''), '+91', ''), '+', '') LIKE ?
        )
      )
    ORDER BY g.submitted_at DESC
  `;

  return db.prepare(query).all(cleanRegd, `%${last10Digits}`, cleanRegd, `%${last10Digits}`);
}

/**
 * Normalizes and finds a grievance by ID, reference number, or case-insensitive representation.
 */
function findGrievanceRecord(db, idOrNo) {
  if (!idOrNo) return null;
  const raw = String(idOrNo).trim();
  let decoded = raw;
  try { decoded = decodeURIComponent(raw).trim(); } catch (e) {}
  const upper = decoded.toUpperCase();

  return db.prepare(`
    SELECT * FROM grievances 
    WHERE grievance_id = ? 
       OR UPPER(TRIM(grievance_no)) = ? 
       OR UPPER(TRIM(grievance_id)) = ?
       OR grievance_no = ?
       OR grievance_id = ?
  `).get(decoded, upper, upper, raw, raw);
}

/**
 * Get a single grievance with its full event timeline, enriched student profile, department, and committee details.
 */
function getGrievance(idOrNo) {
  const db = getDb();
  if (!idOrNo) return null;
  const raw = String(idOrNo).trim();
  let decoded = raw;
  try { decoded = decodeURIComponent(raw).trim(); } catch (e) {}
  const upper = decoded.toUpperCase();

  const grievance = db.prepare(`
    SELECT g.*,
           COALESCE(u.full_name, g.complainant_name) as student_name,
           u.email as student_email,
           COALESCE(u.username, g.complainant_regd_no) as student_username,
           g.complainant_regd_no,
           g.complainant_phone,
           d.name as department_name,
           d.code as department_code,
           c.name as committee_name,
           c.mandate as committee_mandate
    FROM grievances g
    LEFT JOIN users u ON g.student_id = u.user_id
    LEFT JOIN departments d ON g.department_id = d.department_id
    LEFT JOIN committees c ON g.committee_id = c.committee_id
    WHERE g.grievance_id = ? 
       OR UPPER(TRIM(g.grievance_no)) = ? 
       OR UPPER(TRIM(g.grievance_id)) = ? 
       OR g.grievance_no = ?
       OR g.grievance_id = ?
  `).get(decoded, upper, upper, raw, raw);
  if (!grievance) return null;

  const events = db.prepare(`
    SELECT ge.*, u.full_name as actor_name, u.role as actor_user_role
    FROM grievance_events ge
    LEFT JOIN users u ON ge.actor_user_id = u.user_id
    WHERE ge.grievance_id = ?
    ORDER BY ge.occurred_at ASC
  `).all(grievance.grievance_id);

  const dispatch_logs = dispatchService.getDispatchLogs(grievance.grievance_no);
  return { ...grievance, events, dispatch_logs };
}

/**
 * List grievances with optional filters and authority jurisdictional scoping.
 */
function listGrievances(filters = {}, user = null) {
  const db = getDb();
  let query = `
    SELECT g.*,
           COALESCE(u.full_name, g.complainant_name) as student_name,
           u.email as student_email,
           COALESCE(u.username, g.complainant_regd_no) as student_username,
           g.complainant_regd_no,
           g.complainant_phone,
           d.name as department_name,
           d.code as department_code,
           c.name as committee_name
    FROM grievances g
    LEFT JOIN users u ON g.student_id = u.user_id
    LEFT JOIN departments d ON g.department_id = d.department_id
    LEFT JOIN committees c ON g.committee_id = c.committee_id
    WHERE 1=1
  `;
  const params = [];

  // Scoping: Department HODs only see their department
  if (user && user.role === 'HOD' && user.department_id) {
    query += ' AND g.department_id = ?';
    params.push(user.department_id);
  }

  // Scoping: Committee members only see their committee grievances
  if (user && user.committee_id) {
    query += ' AND g.committee_id = ?';
    params.push(user.committee_id);
  }

  // General Filters
  if (filters.status) {
    query += ' AND g.status = ?';
    params.push(filters.status);
  }
  if (filters.category) {
    query += ' AND g.category = ?';
    params.push(filters.category);
  }
  if (filters.severity) {
    query += ' AND g.severity = ?';
    params.push(filters.severity);
  }
  if (filters.department_id) {
    query += ' AND g.department_id = ?';
    params.push(filters.department_id);
  }
  if (filters.committee_id) {
    query += ' AND g.committee_id = ?';
    params.push(filters.committee_id);
  }
  if (filters.assigned_to_role) {
    query += ' AND g.assigned_to_role = ?';
    params.push(filters.assigned_to_role);
  }
  if (filters.is_statutory !== undefined) {
    query += ' AND g.is_statutory_route = ?';
    params.push(filters.is_statutory ? 1 : 0);
  }

  query += ' ORDER BY g.submitted_at DESC';
  return db.prepare(query).all(...params);
}

/**
 * Resolve a grievance with reasoning (requires human actor).
 */
function resolveGrievance(idOrNo, resolution, actorUserId) {
  const db = getDb();
  const grievance = findGrievanceRecord(db, idOrNo);
  if (!grievance) throw new Error(`Grievance "${idOrNo}" not found`);

  const resolvedAt = new Date().toISOString();
  db.prepare(`
    UPDATE grievances SET status = 'RESOLVED', resolution = ?, resolved_at = ?, updated_at = ?
    WHERE grievance_id = ?
  `).run(resolution, resolvedAt, resolvedAt, grievance.grievance_id);

  addEvent(db, grievance.grievance_id, 'RESOLVED', actorUserId, null,
    `Resolution: ${resolution}`);

  // Notify student
  notificationService.notifyResolution({
    grievanceId: grievance.grievance_id,
    grievanceNo: grievance.grievance_no,
    resolution,
    category: grievance.category
  });

  // Automated WhatsApp / SMS dispatch
  try {
    if (!grievance.is_anonymous && grievance.complainant_phone) {
      dispatchService.sendResolutionNotice({
        grievanceNo: grievance.grievance_no,
        category: grievance.category,
        studentName: grievance.complainant_name,
        studentPhone: grievance.complainant_phone,
        resolution
      });
    }
  } catch (e) {
    console.error('[DISPATCH RESOLUTION ERROR]', e);
  }

  return { success: true, resolvedAt, grievanceNo: grievance.grievance_no };
}

/**
 * Appeal a resolved grievance.
 */
function appealGrievance(idOrNo, reason, actorUserId) {
  const db = getDb();
  const grievance = findGrievanceRecord(db, idOrNo);
  if (!grievance) throw new Error(`Grievance "${idOrNo}" not found`);

  db.prepare(`
    UPDATE grievances SET status = 'APPEALED', appeal_reason = ?, updated_at = ?
    WHERE grievance_id = ?
  `).run(reason, new Date().toISOString(), grievance.grievance_id);

  addEvent(db, grievance.grievance_id, 'APPEALED', actorUserId, null,
    `Appeal reason: ${reason}`);

  return { success: true, grievanceNo: grievance.grievance_no };
}

/**
 * Rate satisfaction after closure.
 */
function rateSatisfaction(idOrNo, ratingOrPayload, commentArg, actorUserIdArg) {
  let rating = ratingOrPayload;
  let comment = commentArg;
  let actorUserId = actorUserIdArg;

  if (typeof ratingOrPayload === 'object' && ratingOrPayload !== null) {
    rating = ratingOrPayload.rating;
    comment = ratingOrPayload.comment;
    actorUserId = commentArg || ratingOrPayload.actorUserId;
  }

  rating = Number(rating);

  const db = getDb();
  const grievance = findGrievanceRecord(db, idOrNo);
  if (!grievance) throw new Error(`Grievance "${idOrNo}" not found`);

  db.prepare(`
    UPDATE grievances SET satisfaction_rating = ?, satisfaction_comment = ?,
    status = 'CLOSED', updated_at = ?
    WHERE grievance_id = ?
  `).run(rating, comment || null, new Date().toISOString(), grievance.grievance_id);

  addEvent(db, grievance.grievance_id, 'SATISFACTION_RATED', actorUserId, null,
    `Rating: ${rating}/5` + (comment ? ` — ${comment}` : ''));

  addEvent(db, grievance.grievance_id, 'CLOSED', actorUserId, null, 'Case closed after satisfaction feedback');

  notificationService.notifyFeedback({
    grievanceId: grievance.grievance_id,
    grievanceNo: grievance.grievance_no,
    rating,
    comment,
    category: grievance.category,
    departmentId: grievance.department_id
  });

  return { success: true, grievanceNo: grievance.grievance_no };
}

// --- Helpers ---

function addEvent(db, grievanceId, eventType, actorUserId, actorRole, notes, metadata) {
  let validActorId = null;
  if (actorUserId) {
    try {
      const user = db.prepare('SELECT user_id FROM users WHERE user_id = ? OR username = ?').get(actorUserId, actorUserId);
      if (user) {
        validActorId = user.user_id;
      }
    } catch (e) {}
  }

  db.prepare(`
    INSERT INTO grievance_events (grievance_event_id, grievance_id, occurred_at, event_type, actor_user_id, actor_role, notes, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), grievanceId, new Date().toISOString(),
    eventType, validActorId, actorRole || (actorUserId ? String(actorUserId) : null),
    notes || null, metadata ? JSON.stringify(metadata) : null
  );
}

function logAgentRun(db, grievanceId, action, outputData) {
  db.prepare(`
    INSERT INTO agent_runs (agent_run_id, agent_code, trigger_type, grievance_id, action, output_data, started_at, finished_at, status)
    VALUES (?, 'A46_GRIEVANCE', 'USER', ?, ?, ?, ?, ?, 'SUCCEEDED')
  `).run(
    uuidv4(), grievanceId, action,
    JSON.stringify(outputData),
    new Date().toISOString(),
    new Date().toISOString()
  );
}

/**
 * Retrieve precedent from similar past resolved/closed cases.
 * Supports the resolution process with historical context, rulings, and precedent.
 */
function getPrecedents(idOrNo) {
  const db = getDb();
  const target = db.prepare('SELECT * FROM grievances WHERE grievance_id = ? OR grievance_no = ?').get(idOrNo, idOrNo);
  if (!target) return [];

  let keywords = [];
  try {
    keywords = JSON.parse(target.classifier_keywords || '[]');
  } catch (e) {
    keywords = [];
  }

  const candidates = db.prepare(`
    SELECT g.grievance_id, g.grievance_no, g.category, g.severity, g.description,
           g.resolution, g.submitted_at, g.resolved_at, g.satisfaction_rating,
           g.assigned_to_role, d.name as department_name, c.name as committee_name,
           ROUND((julianday(g.resolved_at) - julianday(g.submitted_at)) * 24, 1) as resolution_hours
    FROM grievances g
    LEFT JOIN departments d ON g.department_id = d.department_id
    LEFT JOIN committees c ON g.committee_id = c.committee_id
    WHERE g.grievance_id != ?
      AND g.status IN ('RESOLVED', 'CLOSED')
      AND g.resolution IS NOT NULL
      AND (g.category = ? OR g.department_id = ?)
    ORDER BY g.resolved_at DESC
    LIMIT 20
  `).all(target.grievance_id, target.category, target.department_id || '');

  const targetDescLower = (target.description || '').toLowerCase();
  const scored = candidates.map(c => {
    let score = 0;
    const cDescLower = (c.description || '').toLowerCase();
    const cResLower = (c.resolution || '').toLowerCase();

    if (c.category === target.category) score += 40;
    if (c.severity === target.severity) score += 15;
    if (c.department_name && target.department_id && c.department_name.includes(target.department_id)) score += 15;

    for (const kw of keywords) {
      if (cDescLower.includes(kw.toLowerCase()) || cResLower.includes(kw.toLowerCase())) {
        score += 10;
      }
    }

    if (c.satisfaction_rating && c.satisfaction_rating >= 4) {
      score += 10;
    }

    const similarity = Math.min(Math.round(score), 98);

    return {
      grievanceNo: c.grievance_no,
      category: c.category,
      severity: c.severity,
      department: c.department_name || 'General Campus',
      committee: c.committee_name || c.assigned_to_role,
      summary: c.description.length > 140 ? c.description.slice(0, 137) + '...' : c.description,
      resolution: c.resolution,
      resolutionHours: c.resolution_hours || 24,
      satisfactionRating: c.satisfaction_rating || null,
      similarityScore: similarity,
      resolvedAt: c.resolved_at
    };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, 3);
}

/**
 * Generate an official University Resolution Letter with formal reasoning,
 * statutory clauses, appeal provisions, and verifiable dispatch metadata.
 */
function generateResolutionLetter(idOrNo) {
  const g = getGrievance(idOrNo);
  if (!g) throw new Error('Grievance not found');

  const dispatchRef = `VFSTR/GRC/${new Date().getFullYear()}/ORD-${g.grievance_no.replace('GRV-', '')}`;
  const issuanceDate = g.resolved_at ? new Date(g.resolved_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const appealDeadlineDate = g.resolved_at ? new Date(new Date(g.resolved_at).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  }) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const presidingOfficer = g.assigned_to_role === 'ANTI_RAGGING_COMMITTEE'
    ? { name: 'Prof. K. Ramamurthy', title: 'Chairperson, University Anti-Ragging Committee', body: 'Statutory Anti-Ragging & Discipline Authority' }
    : g.assigned_to_role === 'HOD'
    ? { name: 'Head of Department', title: `Head, Department of ${g.department_name || 'Academic Studies'}`, body: 'Departmental Grievance Redressal Committee' }
    : { name: 'Dr. M. S. R. Murthy', title: 'Director & Convener, Central Grievance Redressal Cell', body: 'Central Student Grievance Redressal Committee' };

  return {
    institution: {
      name: "Vignan's Foundation for Science, Technology & Research",
      accreditation: "Deemed to be University u/s 3 of UGC Act 1956 | NAAC A+ Accredited",
      location: "Vadlamudi, Guntur District, Andhra Pradesh - 522213",
      cell: "Central Grievance Redressal Cell (CGRC)"
    },
    dispatchRef,
    issuanceDate,
    appealDeadlineDate,
    grievance: {
      grievanceNo: g.grievance_no,
      category: g.category,
      severity: g.severity,
      submittedAt: g.submitted_at,
      resolvedAt: g.resolved_at,
      status: g.status,
      isAnonymous: Boolean(g.is_anonymous),
      complainantName: g.is_anonymous ? 'Protected Confidential Whistleblower' : (g.student_name || 'Student'),
      complainantRegdNo: g.is_anonymous ? 'CONFIDENTIAL (Identity Decoupled)' : (g.complainant_regd_no || g.student_username || 'Enrolled Student'),
      department: g.department_name || 'General / Inter-Departmental',
      description: g.description,
      resolution: g.resolution || 'Inquiry finalized and corrective orders dispatched.'
    },
    regulatoryContext: g.is_statutory_route
      ? "UGC (Prevention, Prohibition and Redressal of Sexual Harassment & Ragging) Regulations, and Supreme Court Guidelines"
      : "UGC (Redressal of Grievances of Students) Regulations, 2023 and VFSTR Institutional Academic Policy",
    findings: g.resolution || 'The matter has been inquired into by the assigned competent authority. Remedial actions have been implemented and validated in accordance with university standards.',
    appealProvisions: {
      appellateAuthority: "Office of the Vice-Chancellor / Dean of Student Affairs",
      windowDays: 15,
      deadline: appealDeadlineDate,
      mode: "Online Grievance Redressal Portal (Appeal Action) or Written Submission to the Registrar"
    },
    signatory: presidingOfficer,
    verificationCode: `VERIFY-GRC-${Buffer.from(g.grievance_no + dispatchRef).toString('base64').slice(0, 16).toUpperCase()}`
  };
}

module.exports = {
  submitGrievance,
  getGrievance,
  getAnonymousGrievance,
  getStudentGrievances,
  listGrievances,
  resolveGrievance,
  appealGrievance,
  rateSatisfaction,
  getPrecedents,
  generateResolutionLetter,
  addEvent,
  logAgentRun
};
