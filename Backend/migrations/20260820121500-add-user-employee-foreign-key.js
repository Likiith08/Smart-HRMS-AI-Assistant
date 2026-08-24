"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint("users", {
      fields: ["employee_id"],
      type: "foreign key",
      name: "fk_users_employee_id",
      references: {
        table: "employees",
        field: "employee_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("users", "fk_users_employee_id");
  },
};
