const express = require("express");
const controller = require("../controllers/attendanceController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// All logged-in users can punch in/out and view their own attendance
router.post("/punch-in", authenticate, controller.punchIn);
router.post("/punch-out", authenticate, controller.punchOut);
router.get("/today", authenticate, controller.getTodayAttendance);

// HR / Manager / Admin can view all attendance
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "HR", "MANAGER"),
  controller.getAllAttendance
);

module.exports = router;