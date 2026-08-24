"use strict";

const { AuditLog, User } = require("../models");

const getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const logs = await AuditLog.findAll({
      limit,
      order: [["created_at", "DESC"]],
      include: [{ model: User, as: "user", attributes: ["user_id", "username", "email"] }],
    });
    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
  }
};

module.exports = { getAuditLogs };
