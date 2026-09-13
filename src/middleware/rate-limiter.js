// =====================================================================
// Campus Anti-Spam & Rate Limiter Middleware — Agent 46
// Protects the university grievance intake pipeline from denial-of-service,
// automated script floods, and prank complaint bots.
// =====================================================================

const rateLimit = require('express-rate-limit');

// 1. General API rate limiter (protects against DoS / automated script floods)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Max 300 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this network. System rate limit enforced for campus security.'
  }
});

// 2. Authentication rate limiter (protects against password brute-forcing)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AUTH_RATE_LIMIT',
    message: 'Too many failed officer sign-in attempts. For security reasons, please wait 15 minutes before retrying.'
  }
});

// 3. Confidential PIN & Tracking rate limiter (protects against PIN brute-forcing)
const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 case lookups per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'LOOKUP_RATE_LIMIT',
    message: 'Too many tracking inquiries from this IP address. Please wait 15 minutes.'
  }
});

// 4. Rate limiter for public grievance intake (Max 5 submissions per 15 min per network)
const intakeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit each IP to 5 grievance submissions per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded: Maximum 5 grievance submissions allowed per 15 minutes from this network to prevent flood attacks and pranks.'
  }
});

// 5. Honeypot bot trap validator
function honeypotTrap(req, res, next) {
  if (req.body && req.body._vignan_hp_check) {
    console.warn(`[SECURITY HONEYPOT] Spam bot trapped and deflected from IP: ${req.ip}`);
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

module.exports = {
  apiLimiter,
  loginLimiter,
  trackingLimiter,
  intakeLimiter,
  honeypotTrap
};
