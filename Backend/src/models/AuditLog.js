"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    audit_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity_type: { type: DataTypes.STRING(100), allowNull: true },
    entity_id: { type: DataTypes.STRING(100), allowNull: true },
    details: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(64), allowNull: true },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = AuditLog;
