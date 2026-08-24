"use strict";

const { Op } = require("sequelize");
const { LeaveType, LeaveBalance, LeaveRequest, Employee } = require("../models");
const leaveService = require("../services/leaveService");
const auditService = require("../services/auditService");

const MANAGEMENT_ROLES = ["ADMIN", "HR", "MANAGER"];

const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.findAll({
      where: { status: "ACTIVE" },
      order: [["leave_name", "ASC"]],
    });

    return res.json({ success: true, data: leaveTypes });
  } catch (error) {
    console.error("getLeaveTypes error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave types" });
  }
};

const getMyBalances = async (req, res) => {
  try {
    const employeeId = Number(req.user.employee_id);
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee profile is not linked to this user" });
    }

    const balances = await LeaveBalance.findAll({
      where: { employee_id: employeeId },
      include: [{
        model: LeaveType,
        as: "leaveType",
        attributes: ["leave_type_id", "leave_name", "description", "annual_limit", "status"],
      }],
      order: [["year", "DESC"], ["leave_type_id", "ASC"]],
    });

    return res.json({ success: true, data: balances });
  } catch (error) {
    console.error("getMyBalances error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave balances" });
  }
};

const applyLeave = async (req, res) => {
  try {
    const { leave_type_id, start_date, end_date, reason } = req.body;
    const employeeId = Number(req.user.employee_id);

    if (!leave_type_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: "leave_type_id, start_date and end_date are required" });
    }
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee profile is not linked to this user" });
    }

    const leave = await leaveService.applyLeave({
      employeeId,
      leaveTypeId: Number(leave_type_id),
      startDate: start_date,
      endDate: end_date,
      reason,
    });

    auditService.log({
      userId: req.user.user_id,
      action: "LEAVE_APPLIED",
      entityType: "LEAVE_REQUEST",
      entityId: leave.leave_request_id,
      details: { employeeId, leaveTypeId: Number(leave_type_id), start_date, end_date },
      req,
    }).catch(console.error);

    return res.status(201).json({ success: true, message: "Leave request submitted successfully", data: leave });
  } catch (error) {
    console.error("applyLeave error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getLeaves = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === "MANAGER") {
      // Managers only see requests from their own direct reports, not the
      // whole organization — full visibility stays with HR/ADMIN.
      if (!req.user.employee_id) {
        return res.status(400).json({ success: false, message: "Employee profile is not linked to this user" });
      }
      const reports = await Employee.findAll({
        where: { manager_id: req.user.employee_id },
        attributes: ["employee_id"],
      });
      const reportIds = reports.map((r) => r.employee_id);
      // Include the manager's own requests too, so they can see their own history.
      where.employee_id = { [Op.in]: [...reportIds, req.user.employee_id] };
    } else if (!MANAGEMENT_ROLES.includes(req.user.role)) {
      if (!req.user.employee_id) {
        return res.status(400).json({ success: false, message: "Employee profile is not linked to this user" });
      }
      where.employee_id = req.user.employee_id;
    }

    const leaves = await LeaveRequest.findAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["employee_id", "employee_code", "first_name", "last_name", "department_id", "designation"],
        },
        {
          model: LeaveType,
          as: "leaveType",
          attributes: ["leave_type_id", "leave_name", "annual_limit"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json({ success: true, data: leaves });
  } catch (error) {
    console.error("getLeaves error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave requests" });
  }
};

const getLeaveById = async (req, res) => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id, {
      include: [
        { model: Employee, as: "employee", attributes: ["employee_id", "employee_code", "first_name", "last_name", "department_id", "designation"] },
        { model: LeaveType, as: "leaveType", attributes: ["leave_type_id", "leave_name", "annual_limit"] },
      ],
    });

    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    if (!MANAGEMENT_ROLES.includes(req.user.role) && Number(leave.employee_id) !== Number(req.user.employee_id)) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this leave request" });
    }

    return res.json({ success: true, data: leave });
  } catch (error) {
    console.error("getLeaveById error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave request" });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const normalizedStatus = String(req.body.status || "").toUpperCase();
    const rejectionReason = String(req.body.rejection_reason || "").trim();

    if (!["APPROVED", "REJECTED"].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Status must be APPROVED or REJECTED" });
    }
    if (!req.user.employee_id) {
      return res.status(400).json({ success: false, message: "Approver is not linked to an employee profile" });
    }
    if (normalizedStatus === "REJECTED" && !rejectionReason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const leave = await leaveService.updateLeaveStatus({
      leaveRequestId: Number(req.params.id),
      status: normalizedStatus,
      approvedBy: Number(req.user.employee_id),
      approverRole: req.user.role,
      rejectionReason: rejectionReason || null,
    });

    auditService.log({
      userId: req.user.user_id,
      action: `LEAVE_${normalizedStatus}`,
      entityType: "LEAVE_REQUEST",
      entityId: leave.leave_request_id,
      details: { rejectionReason: rejectionReason || null },
      req,
    }).catch(console.error);

    return res.json({ success: true, message: `Leave request ${normalizedStatus.toLowerCase()} successfully`, data: leave });
  } catch (error) {
    console.error("updateLeaveStatus error:", error);
    const isAuthError = /cannot approve|not authorized|only this employee/i.test(error.message || "");
    return res.status(isAuthError ? 403 : 400).json({ success: false, message: error.message });
  }
};

module.exports = { getLeaveTypes, getMyBalances, applyLeave, getLeaves, getLeaveById, updateLeaveStatus };
