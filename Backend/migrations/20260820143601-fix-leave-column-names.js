"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const describe = async (table) =>
      queryInterface.describeTable(table);

    // ============================================================
    // LEAVE TYPES
    // ============================================================

    let columns =
      await describe("leave_types");

    if (
      columns.name &&
      !columns.leave_name
    ) {
      await queryInterface.renameColumn(
        "leave_types",
        "name",
        "leave_name"
      );
    }

    columns =
      await describe("leave_types");

    if (
      columns.days_per_year &&
      !columns.annual_limit
    ) {
      await queryInterface.renameColumn(
        "leave_types",
        "days_per_year",
        "annual_limit"
      );
    }

    columns =
      await describe("leave_types");

    if (!columns.status) {
      await queryInterface.addColumn(
        "leave_types",
        "status",
        {
          type: Sequelize.ENUM(
            "ACTIVE",
            "INACTIVE"
          ),
          allowNull: false,
          defaultValue: "ACTIVE",
        }
      );
    }

    // ============================================================
    // LEAVE BALANCES
    // ============================================================

    columns =
      await describe("leave_balances");

    if (!columns.year) {
      await queryInterface.addColumn(
        "leave_balances",
        "year",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        }
      );

      await queryInterface.sequelize.query(
        `UPDATE leave_balances
         SET year = YEAR(CURDATE())
         WHERE year IS NULL`
      );

      await queryInterface.changeColumn(
        "leave_balances",
        "year",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        }
      );
    }

    // ============================================================
    // LEAVE BALANCE UNIQUE CONSTRAINT
    // ============================================================

    const [indexes] =
      await queryInterface.sequelize.query(
        "SHOW INDEX FROM leave_balances"
      );

    const hasUniqueIndex =
      indexes.some(
        (index) =>
          index.Key_name ===
          "unique_employee_leave_balance_year"
      );

    if (!hasUniqueIndex) {
      await queryInterface.addConstraint(
        "leave_balances",
        {
          fields: [
            "employee_id",
            "leave_type_id",
            "year",
          ],

          type: "unique",

          name:
            "unique_employee_leave_balance_year",
        }
      );
    }

    // ============================================================
    // LEAVE REQUESTS
    // ============================================================

    columns =
      await describe("leave_requests");

    if (
      columns.number_of_days &&
      !columns.total_days
    ) {
      await queryInterface.renameColumn(
        "leave_requests",
        "number_of_days",
        "total_days"
      );
    }
  },

  async down() {
    // This is a repair migration.
    // Do not automatically reverse these changes.
  },
};