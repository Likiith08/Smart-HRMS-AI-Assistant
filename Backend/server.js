"use strict";

require("dotenv").config();

const app = require("./src/app");
const { sequelize } = require("./src/models");

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL database connection established.");

    app.listen(PORT, () => {
      console.log(`MY HRMS Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start MY HRMS Backend:", error.parent?.sqlMessage || error.message);
    process.exit(1);
  }
};

startServer();
