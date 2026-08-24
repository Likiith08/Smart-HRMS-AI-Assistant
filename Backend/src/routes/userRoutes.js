const express = require("express");

const controller = require("../controllers/userController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// MY PROFILE
// ============================================================

// Every authenticated user can view their own profile
router.get(
  "/me",
  authenticate,
  controller.getMyProfile
);


// Every authenticated user can update their own profile
router.put(
  "/me",
  authenticate,
  controller.updateMyProfile
);


// ============================================================
// ADMIN USER MANAGEMENT
// ============================================================

router.use(
  authenticate,
  authorizeRoles("ADMIN")
);


// Get all users
router.get(
  "/",
  controller.getUsers
);


// Change user role
router.patch(
  "/:id/role",
  controller.updateUserRole
);


// Activate / deactivate / lock user
router.patch(
  "/:id/status",
  controller.updateUserStatus
);


module.exports = router;