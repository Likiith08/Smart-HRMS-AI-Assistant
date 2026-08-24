"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("leaves", {
      leave_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "employees",
          key: "employee_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      leave_type: {
        type: Sequelize.ENUM(
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
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "PENDING",
          "APPROVED",
          "REJECTED",
          "CANCELLED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
      },

      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "employees",
          key: "employee_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.dropTable("leaves");
  },
};