"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LeaveBalance = sequelize.define(
  "LeaveBalance",
  {
    leave_balance_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leave_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_days: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    used_days: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    remaining_days: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "leave_balances",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = LeaveBalance;
