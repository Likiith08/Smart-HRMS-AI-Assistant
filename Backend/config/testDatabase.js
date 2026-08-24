require("dotenv").config();

const sequelize = require("./database");

async function testDatabase() {
  try {
    await sequelize.authenticate();

    console.log("MySQL connection successful through Sequelize.");
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
  } finally {
    await sequelize.close();
  }
}

testDatabase();