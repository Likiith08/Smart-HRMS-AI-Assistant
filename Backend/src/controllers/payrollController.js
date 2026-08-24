const { Payroll, Employee, Department } = require("../models");
const auditService = require("../services/auditService");

// =====================================================
// CREATE PAYROLL
// ADMIN / HR / MANAGER
// =====================================================

const createPayroll = async (req, res) => {
  try {
    const {
      employee_id,
      pay_period_start,
      pay_period_end,
      basic_salary,
      allowances = 0,
      deductions = 0,
      remarks,
    } = req.body;

    if (
      !employee_id ||
      !pay_period_start ||
      !pay_period_end ||
      basic_salary === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "employee_id, pay_period_start, pay_period_end and basic_salary are required",
      });
    }

    const employee = await Employee.findByPk(employee_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (new Date(pay_period_start) > new Date(pay_period_end)) {
      return res.status(400).json({
        success: false,
        message: "Pay period start date cannot be after end date",
      });
    }

    const existingPayroll = await Payroll.findOne({
      where: {
        employee_id,
        pay_period_start,
        pay_period_end,
      },
    });

    if (existingPayroll) {
      return res.status(409).json({
        success: false,
        message: "Payroll already exists for this employee and pay period",
      });
    }

    const basic = Number(basic_salary);
    const allowanceAmount = Number(allowances);
    const deductionAmount = Number(deductions);

    const netSalary =
      basic + allowanceAmount - deductionAmount;

    if (netSalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Net salary cannot be negative",
      });
    }

    const payroll = await Payroll.create({
      employee_id,
      pay_period_start,
      pay_period_end,
      basic_salary: basic,
      allowances: allowanceAmount,
      deductions: deductionAmount,
      net_salary: netSalary,
      status: "DRAFT",
      remarks: remarks || null,
    });

    const result = await Payroll.findByPk(payroll.payroll_id, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "employee_id",
            "employee_code",
            "first_name",
            "last_name",
            "email",
            "designation",
          ],
          include: [
            {
              model: Department,
              as: "department",
              attributes: [
                "department_id",
                "department_name",
              ],
            },
          ],
        },
      ],
    });

    auditService.log({
      userId: req.user.user_id,
      action: "PAYROLL_CREATED",
      entityType: "PAYROLL",
      entityId: payroll.payroll_id,
      details: { employee_id, net_salary: netSalary },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create payroll error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payroll",
    });
  }
};


// =====================================================
// GET ALL PAYROLLS
// ADMIN / HR / MANAGER
// =====================================================

const getPayrolls = async (req, res) => {
  try {
    const employeeFilter = req.user?.role === "MANAGER"
      ? { manager_id: req.user.employee_id }
      : undefined;

    const payrolls = await Payroll.findAll({
      include: [
        {
          model: Employee,
          as: "employee",
          ...(employeeFilter ? { where: employeeFilter, required: true } : {}),
          attributes: [
            "employee_id",
            "employee_code",
            "first_name",
            "last_name",
            "email",
            "designation",
          ],
          include: [
            {
              model: Department,
              as: "department",
              attributes: [
                "department_id",
                "department_name",
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error("Get payrolls error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payrolls",
    });
  }
};


// =====================================================
// GET PAYROLL BY ID
// =====================================================

const getPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByPk(
      req.params.id,
      {
        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "employee_id",
              "employee_code",
              "first_name",
              "last_name",
              "email",
              "designation",
            ],
          },
        ],
      }
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    console.error("Get payroll error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payroll",
    });
  }
};


// =====================================================
// UPDATE PAYROLL
// ADMIN / HR / MANAGER
// =====================================================

const updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByPk(
      req.params.id
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (payroll.status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Paid payroll cannot be modified",
      });
    }

    const {
      pay_period_start,
      pay_period_end,
      basic_salary,
      allowances,
      deductions,
      remarks,
    } = req.body;

    const basic =
      basic_salary !== undefined
        ? Number(basic_salary)
        : Number(payroll.basic_salary);

    const allowanceAmount =
      allowances !== undefined
        ? Number(allowances)
        : Number(payroll.allowances);

    const deductionAmount =
      deductions !== undefined
        ? Number(deductions)
        : Number(payroll.deductions);

    const netSalary =
      basic + allowanceAmount - deductionAmount;

    if (netSalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Net salary cannot be negative",
      });
    }

    await payroll.update({
      pay_period_start:
        pay_period_start || payroll.pay_period_start,

      pay_period_end:
        pay_period_end || payroll.pay_period_end,

      basic_salary: basic,
      allowances: allowanceAmount,
      deductions: deductionAmount,
      net_salary: netSalary,
      remarks:
        remarks !== undefined
          ? remarks
          : payroll.remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: payroll,
    });
  } catch (error) {
    console.error("Update payroll error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update payroll",
    });
  }
};


// =====================================================
// PROCESS PAYROLL
// ADMIN / HR
// =====================================================

const processPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByPk(
      req.params.id
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (payroll.status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Payroll is already paid",
      });
    }

    await payroll.update({
      status: "PROCESSED",
    });

    auditService.log({
      userId: req.user.user_id,
      action: "PAYROLL_PROCESSED",
      entityType: "PAYROLL",
      entityId: payroll.payroll_id,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll processed successfully",
      data: payroll,
    });
  } catch (error) {
    console.error("Process payroll error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process payroll",
    });
  }
};


// =====================================================
// MARK PAYROLL AS PAID
// ADMIN / HR
// =====================================================

const markPayrollPaid = async (req, res) => {
  try {
    const payroll = await Payroll.findByPk(
      req.params.id
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (payroll.status !== "PROCESSED") {
      return res.status(400).json({
        success: false,
        message:
          "Only processed payroll can be marked as paid",
      });
    }

    await payroll.update({
      status: "PAID",
      payment_date:
        req.body.payment_date ||
        new Date().toISOString().split("T")[0],
    });

    auditService.log({
      userId: req.user.user_id,
      action: "PAYROLL_PAID",
      entityType: "PAYROLL",
      entityId: payroll.payroll_id,
      details: { payment_date: payroll.payment_date },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll marked as paid",
      data: payroll,
    });
  } catch (error) {
    console.error("Mark payroll paid error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark payroll as paid",
    });
  }
};


// =====================================================
// PAYSLIP VIEW
// =====================================================

const getPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: "employee",
        attributes: ["employee_id", "employee_code", "first_name", "last_name", "email", "designation"],
        include: [{ model: Department, as: "department", attributes: ["department_id", "department_name"] }],
      }],
    });

    if (!payroll) return res.status(404).json({ success: false, message: "Payroll not found" });

    const isManagement = ["ADMIN", "HR", "MANAGER"].includes(req.user.role);
    if (!isManagement && Number(payroll.employee_id) !== Number(req.user.employee_id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.json({
      success: true,
      data: {
        payslip_id: payroll.payroll_id,
        employee: payroll.employee,
        pay_period: { start: payroll.pay_period_start, end: payroll.pay_period_end },
        earnings: { basic_salary: payroll.basic_salary, allowances: payroll.allowances },
        deductions: payroll.deductions,
        net_salary: payroll.net_salary,
        status: payroll.status,
        payment_date: payroll.payment_date,
        remarks: payroll.remarks,
        generated_at: payroll.updated_at,
      },
    });
  } catch (error) {
    console.error("Get payslip error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch payslip" });
  }
};


// =====================================================
// EMPLOYEE PAYSLIPS
// =====================================================

const getMyPayrolls = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to an employee",
      });
    }

    const payrolls = await Payroll.findAll({
      where: {
        employee_id: employeeId,
      },
      order: [["pay_period_end", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error("Get my payrolls error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your payrolls",
    });
  }
};


// =====================================================

module.exports = {
  createPayroll,
  getPayrolls,
  getPayroll,
  updatePayroll,
  processPayroll,
  markPayrollPaid,
  getMyPayrolls,
  getPayslip,
};