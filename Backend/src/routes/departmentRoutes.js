const express = require("express");
const controller = require("../controllers/departmentController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  controller.getDepartments
);

router.get(
  "/:id",
  authenticate,
  controller.getDepartment
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "HR"),
  controller.createDepartment
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "HR"),
  controller.updateDepartment
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  controller.deleteDepartment
);

module.exports = router;