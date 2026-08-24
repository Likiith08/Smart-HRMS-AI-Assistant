const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "LOCKED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = User;