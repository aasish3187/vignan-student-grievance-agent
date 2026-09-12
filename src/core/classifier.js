// =====================================================================
// Grievance Classifier — Agent 46 Core Engine
// Keyword-weighted classification with statutory guardrail.
// Stateless pure function. No DB access.
//
// GUARDRAIL: Statutory categories (HARASSMENT, RAGGING, DISCRIMINATION,
// SAFETY) trigger is_statutory_route = true immediately. The agent
// NEVER summarizes, triages, or processes these autonomously.
// =====================================================================

const { STATUTORY_CATEGORIES, SEVERITY_RULES } = require('../config/sla-policy');

// Weighted keyword maps per category
const KEYWORD_MAP = {
  ACADEMIC: {
    keywords: ['marks', 'grade', 'grading', 'attendance', 'syllabus', 'curriculum', 'course',
               'subject', 'lecture', 'class', 'teaching', 'assignment', 'project', 'lab',
               'internal', 'semester', 'credit', 'backlog', 'result', 'academic', 'study'],
    weight: 1.0
  },
  EXAMINATION: {
    keywords: ['exam', 'examination', 'paper', 'evaluation', 'answer sheet', 'revaluation',
               'marks', 'mid-sem', 'midsem', 'end-sem', 'endsem', 'supply', 'supplementary',
               'question paper', 'copy', 'checking', 'valuation', 'totaling', 'malpractice'],
    weight: 1.2
  },
  FEE: {
    keywords: ['fee', 'fees', 'payment', 'scholarship', 'refund', 'tuition', 'challan',
               'dues', 'fine', 'penalty', 'financial', 'concession', 'waiver', 'money',
               'receipt', 'accounts', 'billing'],
    weight: 1.0
  },
  HOSTEL: {
    keywords: ['hostel', 'mess', 'food', 'room', 'roommate', 'warden', 'block', 'bed',
               'bathroom', 'toilet', 'cleaning', 'laundry', 'curfew', 'gate', 'mess bill',
               'mess food', 'hygiene', 'pest', 'cockroach', 'mosquito', 'water'],
    weight: 1.0
  },
  TRANSPORT: {
    keywords: ['bus', 'transport', 'route', 'driver', 'pickup', 'drop', 'late', 'timing',
               'vehicle', 'seat', 'pass', 'travel', 'commute'],
    weight: 1.0
  },
  INFRASTRUCTURE: {
    keywords: ['infrastructure', 'building', 'lab', 'equipment', 'projector', 'ac',
               'air conditioning', 'fan', 'electricity', 'power', 'wifi', 'internet',
               'network', 'computer', 'chair', 'desk', 'bench', 'broken', 'repair',
               'maintenance', 'plumbing', 'leak', 'electrical', 'facility'],
    weight: 1.0
  },
  FACULTY_CONDUCT: {
    keywords: ['faculty', 'professor', 'teacher', 'sir', 'madam', 'mam', 'behavior',
               'behaviour', 'rude', 'partial', 'partiality', 'biased', 'bias', 'unfair',
               'unprofessional', 'absent faculty', 'not teaching', 'incompetent'],
    weight: 1.1
  },
  // --- STATUTORY CATEGORIES --- (Highest priority detection)
  HARASSMENT: {
    keywords: ['harassment', 'sexual', 'molest', 'inappropriate touch', 'stalking',
               'obscene', 'advances', 'unwanted', 'uncomfortable', 'predatory',
               'sexual harassment', 'posh', 'icc', 'inappropriate behavior',
               'indecent', 'exploit'],
    weight: 2.0  // Double weight — must never be missed
  },
  DISCRIMINATION: {
    keywords: ['discrimination', 'caste', 'religion', 'race', 'gender', 'sexism',
               'casteism', 'communal', 'minority', 'sc', 'st', 'obc', 'reservation',
               'prejudice', 'untouchability', 'humiliat', 'slur', 'derogatory'],
    weight: 2.0
  },
  RAGGING: {
    keywords: ['ragging', 'rag', 'senior', 'junior', 'bully', 'bullying', 'threaten',
               'threat', 'forceful', 'force', 'intimidat', 'haze', 'hazing', 'abuse',
               'physical', 'mental torture', 'money extort', 'extortion', 'pressure',
               'anti-ragging', 'antiragging'],
    weight: 2.0
  },
  SAFETY: {
    keywords: ['safety', 'danger', 'unsafe', 'accident', 'injury', 'fire', 'emergency',
               'security', 'theft', 'stolen', 'break in', 'trespass', 'assault', 'attack',
               'weapon', 'drug', 'substance', 'self harm', 'self-harm', 'suicide'],
    weight: 2.0
  }
};

// Severity-boosting keywords
const SEVERITY_BOOSTERS = {
  HIGH: ['urgent', 'immediate', 'critical', 'serious', 'multiple students',
         'many students', 'repeated', 'again and again', 'no response', 'ignored'],
  CRITICAL: ['life threatening', 'emergency', 'police', 'hospital', 'assault',
             'weapon', 'suicide', 'self harm', 'self-harm']
};

function keywordMatches(text, keyword) {
  if (keyword.length <= 4) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  }
  return text.includes(keyword);
}

/**
 * Classify a grievance description into category + severity.
 * @param {string} description - Raw grievance text
 * @param {string} [hintCategory] - Optional category hint from the form dropdown
 * @returns {{ category, severity, confidence, isStatutoryRoute, keywords }}
 */
function classify(description, hintCategory = null) {
  const text = description.toLowerCase().trim();
  const scores = {};
  const matchedKeywords = {};

  // Score each category
  for (const [category, config] of Object.entries(KEYWORD_MAP)) {
    let score = 0;
    const matches = [];

    for (const keyword of config.keywords) {
      if (keywordMatches(text, keyword)) {
        score += config.weight;
        matches.push(keyword);
      }
    }

    if (score > 0) {
      scores[category] = score;
      matchedKeywords[category] = matches;
    }
  }

  // If user provided a category hint, boost that category
  if (hintCategory && KEYWORD_MAP[hintCategory]) {
    scores[hintCategory] = (scores[hintCategory] || 0) + 1.5;
  }

  // Determine winner
  let detectedCategory = 'OTHER';
  let maxScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = cat;
    }
  }

  // If a hint was provided and no strong keyword match, trust the hint
  if (maxScore < 1 && hintCategory) {
    detectedCategory = hintCategory;
    maxScore = 1.0;
  }

  // ---------------------------------------------------------------
  // GUARDRAIL: Statutory category detection is a HARD CHECK.
  // If ANY statutory keyword appears, override to statutory route
  // regardless of the overall classification score.
  // ---------------------------------------------------------------
  let isStatutoryRoute = false;
  let statutoryOverride = null;

  for (const statCat of STATUTORY_CATEGORIES) {
    if (matchedKeywords[statCat] && matchedKeywords[statCat].length > 0) {
      isStatutoryRoute = true;
      // If the detected category isn't already statutory, override it
      if (!STATUTORY_CATEGORIES.includes(detectedCategory)) {
        statutoryOverride = statCat;
      }
      break;
    }
  }

  if (statutoryOverride) {
    detectedCategory = statutoryOverride;
    maxScore = scores[statutoryOverride] || 2.0;
  }

  // Determine severity
  let severity = isStatutoryRoute
    ? SEVERITY_RULES.STATUTORY_DEFAULT
    : SEVERITY_RULES.NORMAL_DEFAULT;

  if (!isStatutoryRoute) {
    for (const keyword of SEVERITY_BOOSTERS.CRITICAL) {
      if (text.includes(keyword)) {
        severity = 'CRITICAL';
        break;
      }
    }
    if (severity !== 'CRITICAL') {
      for (const keyword of SEVERITY_BOOSTERS.HIGH) {
        if (text.includes(keyword)) {
          severity = 'HIGH';
          break;
        }
      }
    }
  }

  // Calculate confidence (normalized)
  const totalPossibleScore = KEYWORD_MAP[detectedCategory]
    ? KEYWORD_MAP[detectedCategory].keywords.length * KEYWORD_MAP[detectedCategory].weight
    : 1;
  const confidence = Math.min(maxScore / (totalPossibleScore * 0.3), 1.0);

  return {
    category: detectedCategory,
    severity,
    confidence: Math.round(confidence * 1000) / 1000,
    isStatutoryRoute,
    keywords: matchedKeywords[detectedCategory] || [],
    allMatches: matchedKeywords
  };
}

module.exports = { classify, KEYWORD_MAP, STATUTORY_CATEGORIES };
