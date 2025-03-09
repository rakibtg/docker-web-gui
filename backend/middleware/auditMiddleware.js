const db = require("../utilities/db");

const auditMiddleware = async (req, res, next) => {
  try {
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
    // Log the error but don't block the request
    console.error("Audit logging failed:", error);
    next();
  }
};

module.exports = auditMiddleware;
