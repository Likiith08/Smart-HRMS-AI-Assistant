"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payroll = sequelize.define(
  "Payroll",
  {
    payroll_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    pay_period_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    pay_period_end: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    basic_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    allowances: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    deductions: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    net_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM("DRAFT", "PROCESSED", "PAID"),
      allowNull: false,
      defaultValue: "DRAFT",
    },

    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "payrolls",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Payroll;