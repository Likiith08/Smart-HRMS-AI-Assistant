"use strict";

module.exports = {
  async up(queryInterface) {
    const year = new Date().getFullYear();
    const [employees] = await queryInterface.sequelize.query("SELECT employee_id FROM employees");
    const [leaveTypes] = await queryInterface.sequelize.query("SELECT leave_type_id, annual_limit FROM leave_types");

    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        const [existing] = await queryInterface.sequelize.query(
          "SELECT leave_balance_id FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ? LIMIT 1",
          { replacements: [employee.employee_id, leaveType.leave_type_id, year] }
        );
        if (!existing.length) {
          const total = Number(leaveType.annual_limit) || 0;
          const now = new Date();
          await queryInterface.bulkInsert("leave_balances", [{ employee_id: employee.employee_id, leave_type_id: leaveType.leave_type_id, total_days: total, used_days: 0, remaining_days: total, year, created_at: now, updated_at: now }]);
        }
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete("leave_balances", null, {});
  },
};
