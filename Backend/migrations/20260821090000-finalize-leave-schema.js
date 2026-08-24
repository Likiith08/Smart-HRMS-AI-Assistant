"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const describe = () => queryInterface.describeTable("leave_types");

    let columns = await describe();

    if (columns.name && !columns.leave_name) {
      await queryInterface.renameColumn("leave_types", "name", "leave_name");
    }
    columns = await describe();
    if (columns.days_per_year && !columns.annual_limit) {
      await queryInterface.renameColumn("leave_types", "days_per_year", "annual_limit");
    }
    columns = await describe();
    if (!columns.status) {
      await queryInterface.addColumn("leave_types", "status", {
        type: Sequelize.ENUM("ACTIVE", "INACTIVE"),
        allowNull: false,
        defaultValue: "ACTIVE",
      });
    }

    const balanceColumns = await queryInterface.describeTable("leave_balances");
    if (!balanceColumns.year) {
      await queryInterface.addColumn("leave_balances", "year", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
      await queryInterface.sequelize.query(
        "UPDATE leave_balances SET year = YEAR(CURDATE()) WHERE year IS NULL"
      );
      await queryInterface.changeColumn("leave_balances", "year", {
        type: Sequelize.INTEGER,
        allowNull: false,
      });
    }

    const requestColumns = await queryInterface.describeTable("leave_requests");
    if (requestColumns.number_of_days && !requestColumns.total_days) {
      await queryInterface.renameColumn("leave_requests", "number_of_days", "total_days");
    }

    const [indexes] = await queryInterface.sequelize.query("SHOW INDEX FROM leave_balances");
    const hasUnique = indexes.some((index) => index.Key_name === "unique_employee_leave_balance_year");
    if (!hasUnique) {
      await queryInterface.addConstraint("leave_balances", {
        fields: ["employee_id", "leave_type_id", "year"],
        type: "unique",
        name: "unique_employee_leave_balance_year",
      });
    }
  },

  async down() {
    // Repair/compatibility migration; intentionally not reversed.
  },
};
