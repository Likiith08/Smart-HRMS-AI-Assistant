"use strict";

const { Op } = require("sequelize");
const {
  sequelize,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  Employee,
} = require("../models");

const calculateDays = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start or end date");
  }

  if (end < start) {
    throw new Error("End date cannot be before start date");
  }

  return Math.floor((end - start) / 86400000) + 1;
};

const applyLeave = async ({
  employeeId,
  leaveTypeId,
  startDate,
  endDate,
  reason,
}) => {
  const totalDays = calculateDays(startDate, endDate);
  const year = new Date(`${startDate}T00:00:00`).getFullYear();

  const leaveType = await LeaveType.findOne({
    where: { leave_type_id: leaveTypeId, status: "ACTIVE" },
  });

  if (!leaveType) {
    throw new Error("Invalid or inactive leave type");
  }

  // A request cannot overlap another pending/approved request.
  const overlapping = await LeaveRequest.findOne({
    where: {
      employee_id: employeeId,
      status: { [Op.in]: ["PENDING", "APPROVED"] },
      start_date: { [Op.lte]: endDate },
      end_date: { [Op.gte]: startDate },
    },
  });

  if (overlapping) {
    throw new Error("Leave already exists for selected dates");
  }

  // Unpaid leave does not consume an annual balance.
  if (leaveType.leave_name !== "UNPAID") {
    const balance = await LeaveBalance.findOne({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year,
      },
    });

    if (!balance) {
      throw new Error("Leave balance not configured for this employee and year");
    }

    if (Number(balance.remaining_days) < totalDays) {
      throw new Error("Insufficient leave balance");
    }
  }

  return LeaveRequest.create({
    employee_id: employeeId,
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    total_days: totalDays,
    reason: reason || null,
    status: "PENDING",
  });
};

const updateLeaveStatus = async ({
  leaveRequestId,
  status,
  approvedBy,
  approverRole,
  rejectionReason,
}) => {
  const transaction = await sequelize.transaction();

  try {
    const leaveRequest = await LeaveRequest.findByPk(leaveRequestId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!leaveRequest) {
      throw new Error("Leave request not found");
    }

    if (leaveRequest.status !== "PENDING") {
      throw new Error("Leave request has already been processed");
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw new Error("Invalid leave status");
    }

    // ---- Approval hierarchy ---------------------------------------
    // Nobody approves their own leave, regardless of role.
    if (Number(leaveRequest.employee_id) === Number(approvedBy)) {
      throw new Error("You cannot approve or reject your own leave request");
    }

    const requester = await Employee.findByPk(leaveRequest.employee_id, {
      attributes: ["employee_id", "manager_id"],
      transaction,
    });
    if (!requester) {
      throw new Error("Requesting employee record not found");
    }

    if (approverRole === "ADMIN") {
      // Admin is the final authority and may approve anyone's leave.
    } else if (requester.manager_id) {
      // This employee has an assigned manager — only that specific person
      // (matched by employee_id, not by their account's role label — a
      // manager_id can point to any employee) may approve. HR is
      // deliberately excluded here even if HR could otherwise approve
      // unassigned employees below; this is what stops HR from
      // short-circuiting a manager who is already in place.
      if (Number(requester.manager_id) !== Number(approvedBy)) {
        throw new Error("Only this employee's assigned manager (or an Admin) can approve this leave request");
      }
    } else if (approverRole === "HR") {
      // No manager assigned (e.g. the employee is a Manager themselves, or
      // has no reporting line yet) — HR/Admin handles it.
    } else {
      throw new Error("You are not authorized to approve this leave request");
    }
    // -----------------------------------------------------------------

    if (status === "APPROVED") {
      const leaveType = await LeaveType.findByPk(leaveRequest.leave_type_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!leaveType) {
        throw new Error("Leave type not found");
      }

      if (leaveType.leave_name !== "UNPAID") {
        const year = new Date(`${leaveRequest.start_date}T00:00:00`).getFullYear();
        const balance = await LeaveBalance.findOne({
          where: {
            employee_id: leaveRequest.employee_id,
            leave_type_id: leaveRequest.leave_type_id,
            year,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!balance) {
          throw new Error("Leave balance not found");
        }

        if (Number(balance.remaining_days) < Number(leaveRequest.total_days)) {
          throw new Error("Insufficient leave balance");
        }

        await balance.update(
          {
            used_days: Number(balance.used_days) + Number(leaveRequest.total_days),
            remaining_days:
              Number(balance.remaining_days) - Number(leaveRequest.total_days),
          },
          { transaction }
        );
      }
    }

    await leaveRequest.update(
      {
        status,
        approved_by: approvedBy || null,
        approved_at: new Date(),
        rejection_reason:
          status === "REJECTED" ? rejectionReason || null : null,
      },
      { transaction }
    );

    await transaction.commit();
    return leaveRequest;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  calculateDays,
  applyLeave,
  updateLeaveStatus,
};
