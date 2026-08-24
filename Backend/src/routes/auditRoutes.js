const express = require("express");
const controller = require("../controllers/auditController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", authenticate, authorizeRoles("ADMIN"), controller.getAuditLogs);

module.exports = router;
