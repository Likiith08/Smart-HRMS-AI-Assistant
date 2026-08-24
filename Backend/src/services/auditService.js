"use strict";

const { AuditLog } = require("../models");

const log = async ({ userId, action, entityType, entityId, details, req }) => {
  try {
    return await AuditLog.create({
      user_id: userId || null,
      action,
      entity_type: entityType || null,
      entity_id: entityId == null ? null : String(entityId),
      details: details || null,
      ip_address: req?.ip || null,
      user_agent: req?.get?.("user-agent") || null,
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
    return null;
  }
};

module.exports = { log };
