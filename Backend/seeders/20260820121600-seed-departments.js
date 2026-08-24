"use strict";

module.exports = {
  async up(queryInterface) {
    const departments = [
      ["IT", "Information Technology"],
      ["HR", "Human Resources"],
      ["Finance", "Finance and Accounting"],
      ["Operations", "Operations and Administration"],
    ];
    for (const [department_name, description] of departments) {
      const [rows] = await queryInterface.sequelize.query(
        "SELECT department_id FROM departments WHERE department_name = ? LIMIT 1",
        { replacements: [department_name] }
      );
      if (!rows.length) {
        const now = new Date();
        await queryInterface.bulkInsert("departments", [{ department_name, description, created_at: now, updated_at: now }]);
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete("departments", null, {});
  },
};
