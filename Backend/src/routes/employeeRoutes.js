const express = require("express");
const controller = require("../controllers/employeeController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", authenticate, controller.getEmployees);

router.get("/:id", authenticate, controller.getEmployee);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "HR"),
  controller.createEmployee
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "HR"),
  controller.updateEmployee
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  controller.deleteEmployee
);

router.patch(
  "/:id/deactivate",
  authenticate,
  authorizeRoles("ADMIN", "HR"),
  controller.deactivateEmployee
);

module.exports = router;