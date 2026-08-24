"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("employees", {
      employee_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      employee_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },

      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      department_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "departments",
          key: "department_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      designation: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      joining_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      manager_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "employees",
          key: "employee_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      employment_status: {
        type: Sequelize.ENUM(
          "ACTIVE",
          "INACTIVE",
          "ON_LEAVE",
          "TERMINATED"
        ),
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
    await queryInterface.dropTable("employees");
  },
};