"use strict";

const path = require("path");
const dotenv = require("dotenv");
const { Sequelize } = require("sequelize");

// Always load Backend/.env, even when a script is executed from another folder.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const required = ["DB_NAME", "DB_USER", "DB_PASSWORD"];
const missing = required.filter((key) => process.env[key] === undefined);

if (missing.length) {
  throw new Error(`Missing database environment variables: ${missing.join(", ")}`);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
