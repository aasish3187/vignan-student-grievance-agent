// =====================================================================
// Campus Anti-Spam & Rate Limiter Middleware — Agent 46
// Protects the university grievance intake pipeline from denial-of-service,
// automated script floods, and prank complaint bots.
// =====================================================================

const rateLimit = require('express-rate-limit');

// Rate limiter for public grievance intake
const intakeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // Limit each IP to 15 grievance submissions per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many grievance submissions from this network. To prevent system abuse, please wait 15 minutes before submitting another case.'
  }
});

// Honeypot bot trap validator
function honeypotTrap(req, res, next) {
  // If the hidden honeypot field is filled by a bot, reject silently or with generic response
  if (req.body && req.body._vignan_hp_check) {
    console.warn(`[SECURITY] Spam bot detected and blocked from IP: ${req.ip}`);
    return res.status(200).json({
      success: true,
      data: {
        grievanceNo: 'GRV-BLOCKED-BOT',
        message: 'Submission received and scheduled for processing.'
      }
    });
  }
  next();
}

module.exports = { intakeLimiter, honeypotTrap };
