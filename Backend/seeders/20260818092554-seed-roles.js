"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const roles = [
      ["ADMIN", "System administrator"],
      ["HR", "Human resources administrator"],
      ["MANAGER", "Team manager"],
      ["EMPLOYEE", "Regular employee"],
    ];
    for (const [role_name, description] of roles) {
      const [rows] = await queryInterface.sequelize.query(
        "SELECT role_id FROM roles WHERE role_name = ? LIMIT 1",
        { replacements: [role_name] }
      );
      if (!rows.length) {
        await queryInterface.bulkInsert("roles", [{ role_name, description, created_at: now, updated_at: now }]);
      }
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("roles", { role_name: { [Sequelize.Op.in]: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] } });
  },
};
