// 'use strict';

// /** @type {import('sequelize-cli').Migration} */
// module.exports = {
//   async up (queryInterface, Sequelize) {
//     /**
//      * Add altering commands here.
//      *
//      * Example:
//      * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
//      */
//   },

//   async down (queryInterface, Sequelize) {
//     /**
//      * Add reverting commands here.
//      *
//      * Example:
//      * await queryInterface.dropTable('users');
//      */
//   }
// };



"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("attendance", {
      attendance_id: {
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

      attendance_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      punch_in: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      punch_out: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      working_hours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "PRESENT",
          "ABSENT",
          "LEAVE",
          "WFH",
          "HOLIDAY",
          "REGULARIZED"
        ),
        allowNull: false,
        defaultValue: "PRESENT",
      },

      remarks: {
        type: Sequelize.STRING,
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

    await queryInterface.addConstraint("attendance", {
      fields: ["employee_id", "attendance_date"],
      type: "unique",
      name: "unique_employee_attendance_date",
    });

    await queryInterface.addIndex("attendance", ["employee_id"], {
      name: "idx_attendance_employee",
    });

    await queryInterface.addIndex("attendance", ["attendance_date"], {
      name: "idx_attendance_date",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("attendance");
  },
};