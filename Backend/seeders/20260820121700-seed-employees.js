"use strict";

module.exports = {
  async up(queryInterface) {
    const [departments] = await queryInterface.sequelize.query("SELECT department_id, department_name FROM departments");
    const departmentMap = Object.fromEntries(departments.map((d) => [d.department_name, d.department_id]));
    const employees = [
      ["EMP001", "Karna", "Prakash", "karna@gmail.com", "9876543201", "IT", "System Administrator", "2026-01-05"],
      ["EMP002", "Priya", "Nair", "priya@gmail.com", "9876543202", "HR", "HR Manager", "2026-01-03"],
      ["EMP003", "Vikram", "Rao", "vikram@gmail.com", "9876543203", "IT", "Engineering Manager", "2026-01-05"],
      ["EMP004", "Rahul", "Kumar", "rahul@gmail.com", "9876543204", "IT", "Software Engineer", "2026-01-10"],
      ["EMP005", "Ananya", "Das", "ananya@gmail.com", "9876543205", "Finance", "Financial Analyst", "2026-02-01"],
      ["EMP006", "Rohan", "Mehta", "rohan@gmail.com", "9876543206", "Operations", "Operations Executive", "2026-02-05"],
      ["EMP007", "Sneha", "Iyer", "sneha@gmail.com", "9876543207", "IT", "QA Engineer", "2026-02-10"],
      ["EMP008", "Arjun", "Patel", "arjun@gmail.com", "9876543208", "IT", "Backend Developer", "2026-01-15"],
    ];

    for (const [employee_code, first_name, last_name, email, phone, department, designation, joining_date] of employees) {
      const [rows] = await queryInterface.sequelize.query("SELECT employee_id FROM employees WHERE employee_code = ? LIMIT 1", { replacements: [employee_code] });
      if (!rows.length) {
        const now = new Date();
        await queryInterface.bulkInsert("employees", [{
          employee_code, first_name, last_name, email, phone,
          department_id: departmentMap[department], designation, joining_date,
          manager_id: null, employment_status: "ACTIVE", created_at: now, updated_at: now,
        }]);
      }
    }

    const [managerRows] = await queryInterface.sequelize.query("SELECT employee_id, employee_code FROM employees WHERE employee_code IN ('EMP003','EMP002')");
    const managerMap = Object.fromEntries(managerRows.map((e) => [e.employee_code, e.employee_id]));
    const mappings = { EMP004: managerMap.EMP003, EMP005: managerMap.EMP002, EMP006: managerMap.EMP003, EMP007: managerMap.EMP003, EMP008: managerMap.EMP003 };
    for (const [code, managerId] of Object.entries(mappings)) {
      if (managerId) await queryInterface.sequelize.query("UPDATE employees SET manager_id = ? WHERE employee_code = ?", { replacements: [managerId, code] });
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete("employees", null, {});
  },
};
