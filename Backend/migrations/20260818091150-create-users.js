"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "role_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },

      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },

      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("ACTIVE", "INACTIVE", "LOCKED"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};