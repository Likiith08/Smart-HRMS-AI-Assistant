require("dotenv").config();

const mysql = require("mysql2/promise");

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``
    );

    console.log(`Database "${process.env.DB_NAME}" is ready.`);

    await connection.end();
  } catch (error) {
    console.error("Database creation failed:", error.message);
    process.exit(1);
  }
}

createDatabase();