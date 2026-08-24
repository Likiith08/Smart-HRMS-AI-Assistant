"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payrolls", {
      payroll_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
        onDelete: "RESTRICT",
      },

      pay_period_start: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      pay_period_end: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      basic_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      allowances: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      deductions: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      net_salary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      status: {
        type: Sequelize.ENUM(
          "DRAFT",
          "PROCESSED",
          "PAID"
        ),
        allowNull: false,
        defaultValue: "DRAFT",
      },

      payment_date: {
        type: Sequelize.DATEONLY,
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
    await queryInterface.dropTable("payrolls");
  },
};