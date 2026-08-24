const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Department = sequelize.define(
  "Department",
  {
    department_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    department_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "departments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Department;