// =====================================================================
// Multilingual Vernacular Translator — Agent 46
// Detects Telugu script and vernacular input from students, translates to
// standardized English for the AI classifier and HoD Case Dossier, while
// preserving the original Telugu transcript for audit fidelity.
// =====================================================================

// Common Telugu academic and campus grievance lexicon
const TELUGU_DICTIONARY = [
  { pattern: /హాస్టల్|వసతి గృహం/gi, en: 'Hostel' },
  { pattern: /నీరు|నీటి సమస్య|మంచినీరు/gi, en: 'water supply issue' },
  { pattern: /ఆహారం|భోజనం|మెస్/gi, en: 'food mess quality' },
  { pattern: /పరిశుభ్రత|చెత్త|మురికి/gi, en: 'sanitation and hygiene' },
  { pattern: /ల్యాబ్|ప్రయోగశాల/gi, en: 'laboratory' },
  { pattern: /కంప్యూటర్|సిస్టమ్/gi, en: 'computer system' },
  { pattern: /పని చేయడం లేదు|పాడైపోయింది|మరమ్మత్తు/gi, en: 'not working / malfunctioning' },
  { pattern: /పరీక్ష|పరీక్షలు/gi, en: 'examination' },
  { pattern: /మార్కులు|ఫలితాలు/gi, en: 'marks and grading evaluation' },
  { pattern: /ఫీజు|చెల్లింపు|రశీదు/gi, en: 'fee payment and receipt' },
  { pattern: /ర్యాగింగ్|వేధించడం|భయపెట్టడం/gi, en: 'ragging and intimidation' },
  { pattern: /వేధింపులు|అసభ్య ప్రవర్తన/gi, en: 'harassment and misconduct' },
  { pattern: /బస్సు|రవాణా|ఆర్టీసీ/gi, en: 'college bus transport' },
  { pattern: /వైఫై|ఇంటర్నెట్/gi, en: 'campus Wi-Fi and network' },
  { pattern: /తరగతి గది|క్లాస్‌రూమ్|ఫ్యాన్|లైట్/gi, en: 'classroom infrastructure (fans/lights)' },
  { pattern: /ఫ్యాకల్టీ|ప్రొఫెసర్|అధ్యాపకులు/gi, en: 'faculty member' },
  { pattern: /గ్రంథాలయం|లైబ్రరీ|పుస్తకాలు/gi, en: 'library books' },
  { pattern: /తక్షణమే పరిష్కరించండి|సహాయం కావాలి/gi, en: 'urgent resolution required' }
];

function repairEncoding(str) {
  if (!str) return str;
  if (/à[°±]/.test(str)) {
    try {
      const fixed = Buffer.from(str, 'binary').toString('utf8');
      if (/[\u0C00-\u0C7F]/.test(fixed)) return fixed;
    } catch (e) {}
  }
  return str;
}

/**
 * Checks whether text contains Telugu unicode characters.
 */
function isTelugu(text) {
  if (!text) return false;
  const normalized = repairEncoding(text);
  return /[\u0C00-\u0C7F]/.test(normalized);
}

/**
 * Translates vernacular Telugu input into clear, classified English
 * while retaining the authentic voice and intent of the student.
 */
function processMultilingualText(rawText) {
  const text = repairEncoding(rawText);
  if (!text || !isTelugu(text)) {
    return {
      detectedLanguage: 'en',
      isVernacular: false,
      originalText: text,
      translatedText: text
    };
  }

  let englishText = text;
  let translatedKeywords = [];

  for (const item of TELUGU_DICTIONARY) {
    if (item.pattern.test(rawText)) {
      translatedKeywords.push(item.en);
      englishText = englishText.replace(item.pattern, `[${item.en}]`);
    }
  }

  // Construct standardized synthesis for AI classification
  const synthesis = `[Vernacular Telugu Intake Translation]: ${translatedKeywords.join('; ')}. Details: ${englishText}`;

  return {
    detectedLanguage: 'te',
    isVernacular: true,
    originalText: rawText,
    translatedText: synthesis,
    summaryEnglish: translatedKeywords.length > 0 ? translatedKeywords.join(', ') : 'Vernacular Telugu submission'
  };
}

module.exports = { isTelugu, processMultilingualText };
