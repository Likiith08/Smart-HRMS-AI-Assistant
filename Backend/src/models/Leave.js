"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Leave = sequelize.define(
  "Leave",
  {
    leave_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    leave_type: {
      type: DataTypes.ENUM(
        "CASUAL",
        "SICK",
        "EARNED",
        "UNPAID",
        "MATERNITY",
        "PATERNITY",
        "OTHER"
      ),
      allowNull: false,
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },

    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "leaves",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Leave;