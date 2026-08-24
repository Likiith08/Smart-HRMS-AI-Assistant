const express = require("express");

const controller = require("../controllers/leaveController");

const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/types",
  authenticate,
  controller.getLeaveTypes
);

router.get(
  "/balances",
  authenticate,
  controller.getMyBalances
);

router.get(
  "/",
  authenticate,
  controller.getLeaves
);

router.get(
  "/:id",
  authenticate,
  controller.getLeaveById
);

router.post(
  "/",
  authenticate,
  authorizeRoles("EMPLOYEE", "MANAGER", "HR", "ADMIN"),
  controller.applyLeave
);

router.put(
  "/:id/status",
  authenticate,
  authorizeRoles("MANAGER", "HR", "ADMIN"),
  controller.updateLeaveStatus
);

module.exports = router;