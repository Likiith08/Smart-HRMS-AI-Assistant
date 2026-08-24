"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("leave_types", {
      leave_type_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },

      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      days_per_year: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },

      is_paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      status: {
        type: Sequelize.ENUM("ACTIVE", "INACTIVE"),
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

    await queryInterface.createTable("leave_balances", {
      leave_balance_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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

      leave_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "leave_types",
          key: "leave_type_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      total_days: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },

      used_days: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },

      remaining_days: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },

      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addConstraint("leave_balances", {
      fields: ["employee_id", "leave_type_id", "year"],
      type: "unique",
      name: "unique_employee_leave_balance_year",
    });

    await queryInterface.createTable("leave_requests", {
      leave_request_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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

      leave_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "leave_types",
          key: "leave_type_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      number_of_days: {
        type: Sequelize.DECIMAL(5, 2),
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

      rejection_reason: {
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
    await queryInterface.dropTable("leave_requests");
    await queryInterface.removeConstraint(
      "leave_balances",
      "unique_employee_leave_balance_year"
    );
    await queryInterface.dropTable("leave_balances");
    await queryInterface.dropTable("leave_types");
  },
};