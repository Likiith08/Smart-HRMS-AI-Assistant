const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attendance = sequelize.define(
  "Attendance",
  {
    attendance_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    attendance_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    punch_in: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    punch_out: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    working_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "PRESENT",
        "ABSENT",
        "LEAVE",
        "WFH",
        "HOLIDAY",
        "REGULARIZED"
      ),
      defaultValue: "PRESENT",
    },

    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "attendance",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Attendance;