"use strict";

module.exports = {
  async up(queryInterface) {
    const leaveTypes = [
      ["CASUAL", "Casual leave for personal or short-term requirements", 12],
      ["SICK", "Leave for illness or medical reasons", 12],
      ["EARNED", "Earned or annual leave", 15],
      ["UNPAID", "Leave without pay", 0],
      ["MATERNITY", "Maternity leave", 180],
      ["PATERNITY", "Paternity leave", 15],
      ["OTHER", "Other approved leave", 0],
    ];

    for (const [leave_name, description, annual_limit] of leaveTypes) {
      const [rows] = await queryInterface.sequelize.query("SELECT leave_type_id FROM leave_types WHERE leave_name = ? LIMIT 1", { replacements: [leave_name] });
      if (!rows.length) {
        const now = new Date();
        await queryInterface.bulkInsert("leave_types", [{ leave_name, description, annual_limit, status: "ACTIVE", created_at: now, updated_at: now }]);
      }
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("leave_types", { leave_name: { [Sequelize.Op.in]: ["CASUAL", "SICK", "EARNED", "UNPAID", "MATERNITY", "PATERNITY", "OTHER"] } });
  },
};
