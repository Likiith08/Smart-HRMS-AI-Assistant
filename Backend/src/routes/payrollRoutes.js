const express = require("express");

const controller = require("../controllers/payrollController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();


// Employee → own payslips
router.get(
  "/my",
  authenticate,
  controller.getMyPayrolls
);


// Admin / HR / Manager → all payrolls
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "HR", "MANAGER"),
  controller.getPayrolls
);


// Admin / HR / Manager → create payroll
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "HR", "MANAGER"),
  controller.createPayroll
);


// Admin / HR / Manager → get payroll
router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "HR", "MANAGER"),
  controller.getPayroll
);

router.get(
  "/:id/payslip",
  authenticate,
  controller.getPayslip
);


// Admin / HR / Manager → update payroll
router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "HR", "MANAGER"),
  controller.updatePayroll
);


// Admin / HR → process payroll
router.patch(
  "/:id/process",
  authenticate,
  authorizeRoles("ADMIN", "HR"),
  controller.processPayroll
);


// Admin / HR → mark paid
router.patch(
  "/:id/pay",
  authenticate,
  authorizeRoles("ADMIN", "HR"),
  controller.markPayrollPaid
);


module.exports = router;