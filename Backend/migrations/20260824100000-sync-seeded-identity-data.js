"use strict";

// Repairs the original seeded identities so every login account is tied to
// the correct employee, uses the employee's email, and follows the
// employee-name.role username convention. Password hashes are intentionally
// preserved, so existing passwords continue to work.

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [employees] = await queryInterface.sequelize.query(
        `SELECT employee_id, employee_code FROM employees WHERE employee_code IN ('EMP001','EMP002','EMP003','EMP004','EMP005','EMP006','EMP007','EMP008')`,
        { transaction }
      );
      const employeeByCode = Object.fromEntries(employees.map((e) => [e.employee_code, e.employee_id]));

      const canonicalEmployees = [
        ['EMP001', 'Karna', 'Prakash', 'karna@gmail.com', '9876543201', 'System Administrator'],
        ['EMP002', 'Priya', 'Nair', 'priya@gmail.com', '9876543202', 'HR Manager'],
        ['EMP003', 'Vikram', 'Rao', 'vikram@gmail.com', '9876543203', 'Engineering Manager'],
        ['EMP004', 'Rahul', 'Kumar', 'rahul@gmail.com', '9876543204', 'Software Engineer'],
        ['EMP005', 'Ananya', 'Das', 'ananya@gmail.com', '9876543205', 'Financial Analyst'],
        ['EMP006', 'Rohan', 'Mehta', 'rohan@gmail.com', '9876543206', 'Operations Executive'],
        ['EMP007', 'Sneha', 'Iyer', 'sneha@gmail.com', '9876543207', 'QA Engineer'],
        ['EMP008', 'Arjun', 'Patel', 'arjun@gmail.com', '9876543208', 'Backend Developer'],
      ];

      // Temporarily move unique emails out of the way because older broken
      // seed data swapped employee emails between rows.
      for (const [code] of canonicalEmployees) {
        const employeeId = employeeByCode[code];
        if (employeeId) {
          await queryInterface.sequelize.query(
            `UPDATE employees SET email = ? WHERE employee_id = ?`,
            { replacements: [`hrms-employee-${employeeId}@migration.invalid`, employeeId], transaction }
          );
        }
      }

      for (const [code, firstName, lastName, email, phone, designation] of canonicalEmployees) {
        const employeeId = employeeByCode[code];
        if (!employeeId) continue;
        await queryInterface.sequelize.query(
          `UPDATE employees SET first_name = ?, last_name = ?, email = ?, phone = ?, designation = ? WHERE employee_id = ?`,
          { replacements: [firstName, lastName, email, phone, designation, employeeId], transaction }
        );
      }

      const [roles] = await queryInterface.sequelize.query(
        `SELECT role_id, role_name FROM roles WHERE role_name IN ('ADMIN','HR','MANAGER','EMPLOYEE')`,
        { transaction }
      );
      const roleId = Object.fromEntries(roles.map((r) => [r.role_name, r.role_id]));

      const roleByCode = {
        EMP001: 'ADMIN',
        EMP002: 'HR',
        EMP003: 'MANAGER',
        EMP004: 'EMPLOYEE',
        EMP005: 'EMPLOYEE',
        EMP006: 'EMPLOYEE',
        EMP007: 'EMPLOYEE',
        EMP008: 'EMPLOYEE',
      };

      // Move all affected login emails temporarily as well, preventing
      // unique-key collisions while the employee emails are restored.
      for (const [code] of canonicalEmployees) {
        const employeeId = employeeByCode[code];
        if (!employeeId) continue;
        await queryInterface.sequelize.query(
          `UPDATE users SET email = ?, username = ? WHERE employee_id = ?`,
          { replacements: [`hrms-user-${employeeId}@migration.invalid`, `hrms-user-${employeeId}-migration`, employeeId], transaction }
        );
      }

      for (const [code, firstName, , email] of canonicalEmployees) {
        const employeeId = employeeByCode[code];
        if (!employeeId) continue;
        const roleName = roleByCode[code];
        const role = roleId[roleName];
        const username = `${firstName.toLowerCase()}.${roleName === 'ADMIN' ? 'admin' : roleName === 'HR' ? 'hr' : roleName === 'MANAGER' ? 'manager' : 'employee'}`;
        await queryInterface.sequelize.query(
          `UPDATE users SET employee_id = ?, role_id = ?, email = ?, username = ? WHERE employee_id = ?`,
          { replacements: [employeeId, role, email, username, employeeId], transaction }
        );
      }

      // User 8 may have lost its employee link in the old data. Restore it
      // by the canonical EMP008 mapping if it is currently unlinked.
      if (employeeByCode.EMP008) {
        await queryInterface.sequelize.query(
          `UPDATE users SET employee_id = ?, role_id = ?, email = ?, username = ? WHERE user_id = 8`,
          { replacements: [employeeByCode.EMP008, roleId.EMPLOYEE, 'arjun@gmail.com', 'arjun.employee'], transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down() {
    // Identity repair is intentionally irreversible; reverting it would
    // restore the mismatched seed state that caused login/profile bugs.
  },
};
