const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LeaveRequest = sequelize.define(
  "LeaveRequest",
  {
    leave_request_id: {
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

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    total_days: {
      type: DataTypes.DECIMAL(5, 2),
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

    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "leave_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = LeaveRequest;