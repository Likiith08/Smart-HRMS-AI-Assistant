const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Employee = sequelize.define(
  "Employee",
  {
    employee_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    employee_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    designation: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    joining_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    employment_status: {
      type: DataTypes.ENUM(
        "ACTIVE",
        "INACTIVE",
        "ON_LEAVE",
        "TERMINATED"
      ),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "employees",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Employee;