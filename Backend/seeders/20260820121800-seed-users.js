"use strict";

const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    const [roles] = await queryInterface.sequelize.query("SELECT role_id, role_name FROM roles");
    const role = Object.fromEntries(roles.map((r) => [r.role_name, r.role_id]));
    const [employees] = await queryInterface.sequelize.query("SELECT employee_id, employee_code FROM employees");
    const employee = Object.fromEntries(employees.map((e) => [e.employee_code, e.employee_id]));

    const users = [
      ["karna.admin", "karna@gmail.com", "karna@123", "ADMIN", "EMP001"],
      ["priya.hr", "priya@gmail.com", "priya@123", "HR", "EMP002"],
      ["vikram.manager", "vikram@gmail.com", "vikram@123", "MANAGER", "EMP003"],
      ["rahul", "rahul@gmail.com", "rahul@123", "EMPLOYEE", "EMP004"],
      ["ananya", "ananya@gmail.com", "ananya@123", "EMPLOYEE", "EMP005"],
      ["rohan", "rohan@gmail.com", "rohan@123", "EMPLOYEE", "EMP006"],
      ["sneha", "sneha@gmail.com", "sneha@123", "EMPLOYEE", "EMP007"],
      ["arjun", "arjun@gmail.com", "arjun@123", "EMPLOYEE", "EMP008"],
    ];

    for (const [username, email, password, roleName, employeeCode] of users) {
      const [rows] = await queryInterface.sequelize.query("SELECT user_id FROM users WHERE email = ? LIMIT 1", { replacements: [email] });
      if (!rows.length) {
        const now = new Date();
        await queryInterface.bulkInsert("users", [{
          username, email, password_hash: await bcrypt.hash(password, 12),
          role_id: role[roleName], employee_id: employee[employeeCode], status: "ACTIVE",
          created_at: now, updated_at: now,
        }]);
      }
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", { email: { [Op.in]: ["karna@gmail.com", "priya@gmail.com", "vikram@gmail.com", "rahul@gmail.com", "ananya@gmail.com", "rohan@gmail.com", "sneha@gmail.com", "arjun@gmail.com"] } });
  },
};
