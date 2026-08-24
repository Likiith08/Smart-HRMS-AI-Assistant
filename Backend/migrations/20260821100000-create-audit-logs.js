"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("audit_logs", {
      audit_id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "user_id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      action: { type: Sequelize.STRING(100), allowNull: false },
      entity_type: { type: Sequelize.STRING(100), allowNull: true },
      entity_id: { type: Sequelize.STRING(100), allowNull: true },
      details: { type: Sequelize.JSON, allowNull: true },
      ip_address: { type: Sequelize.STRING(64), allowNull: true },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.addIndex("audit_logs", ["user_id"], { name: "idx_audit_user" });
    await queryInterface.addIndex("audit_logs", ["action"], { name: "idx_audit_action" });
    await queryInterface.addIndex("audit_logs", ["created_at"], { name: "idx_audit_created_at" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("audit_logs");
  },
};
