const db = require("../utilities/db");

const auditLogMiddleware = async (req, res, next) => {
  try {
    // Don't log static file requests
    if (!req.path.startsWith("/api")) {
      return next();
    }

    await db.createAuditLog({
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    next();
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Continue with the request even if logging fails
    next();
  }
};

module.exports = auditLogMiddleware;
