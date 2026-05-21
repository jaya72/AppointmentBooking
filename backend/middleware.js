// backend/middleware.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");

// Request Logging Middleware
const logger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
};

// JWT Token Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, error: "Access token is missing or empty" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: "Invalid, expired, or malformed token" });
    }
    req.user = decoded; // Contains id and role
    next();
  });
};

// Role Authorization Middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied. Insufficient privileges." });
    }
    next();
  };
};

// Simple In-Memory Rate Limiter for Auth Routes
const ipLimits = {};
const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const timeframe = 60 * 1000; // 1 minute window
  const limit = 20; // Max 20 requests per minute

  if (!ipLimits[ip]) {
    ipLimits[ip] = [];
  }

  // Filter out expired timestamps
  ipLimits[ip] = ipLimits[ip].filter(timestamp => now - timestamp < timeframe);

  if (ipLimits[ip].length >= limit) {
    return res.status(429).json({ success: false, error: "Too many authentication attempts. Please try again in a minute." });
  }

  ipLimits[ip].push(now);
  next();
};

// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error("[Unhandled Error]:", err);
  
  const status = err.status || 500;
  const message = err.message || "An unexpected internal server error occurred.";
  
  res.status(status).json({
    success: false,
    error: message
  });
};

module.exports = {
  logger,
  authenticateToken,
  requireRole,
  rateLimiter,
  errorHandler
};
