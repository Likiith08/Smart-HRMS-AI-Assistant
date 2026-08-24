"use strict";

const sequelize = require("../config/database");

const Role = require("./Role");
const User = require("./User");
const Department = require("./Department");
const Employee = require("./Employee");
const Attendance = require("./Attendance");
const Payroll = require("./Payroll");
const LeaveType = require("./LeaveType");
const LeaveBalance = require("./LeaveBalance");
const LeaveRequest = require("./LeaveRequest");
const Leave = require("./Leave");
const AuditLog = require("./AuditLog");

// ROLE → USERS
Role.hasMany(User, {
  foreignKey: "role_id",
  as: "users",
});

User.belongsTo(Role, {
  foreignKey: "role_id",
  as: "role",
});

User.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

Employee.hasOne(User, {
  foreignKey: "employee_id",
  as: "user",
});

// DEPARTMENT → EMPLOYEES
Department.hasMany(Employee, {
  foreignKey: "department_id",
  as: "employees",
});

Employee.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});

// EMPLOYEE → MANAGER
Employee.belongsTo(Employee, {
  foreignKey: "manager_id",
  as: "manager",
});

Employee.hasMany(Employee, {
  foreignKey: "manager_id",
  as: "teamMembers",
});

// EMPLOYEE → ATTENDANCE
Employee.hasMany(Attendance, {
  foreignKey: "employee_id",
  as: "attendance",
});

Attendance.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// EMPLOYEE → PAYROLL
Employee.hasMany(Payroll, {
  foreignKey: "employee_id",
  as: "payrolls",
});

Payroll.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// --------------------------------------------------
// EMPLOYEE → LEAVE REQUESTS
// --------------------------------------------------

Employee.hasMany(LeaveRequest, {
  foreignKey: "employee_id",
  as: "leaveRequests",
});

LeaveRequest.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// --------------------------------------------------
// LEAVE TYPE → LEAVE REQUESTS
// --------------------------------------------------

LeaveType.hasMany(LeaveRequest, {
  foreignKey: "leave_type_id",
  as: "leaveRequests",
});

LeaveRequest.belongsTo(LeaveType, {
  foreignKey: "leave_type_id",
  as: "leaveType",
});

// --------------------------------------------------
// EMPLOYEE → LEAVE BALANCES
// --------------------------------------------------

Employee.hasMany(LeaveBalance, {
  foreignKey: "employee_id",
  as: "leaveBalances",
});

LeaveBalance.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});


LeaveType.hasMany(LeaveBalance, {
  foreignKey: "leave_type_id",
  as: "balances",
});

LeaveBalance.belongsTo(LeaveType, {
  foreignKey: "leave_type_id",
  as: "leaveType",
});

// --------------------------------------------------
// EMPLOYEE → LEAVE
// --------------------------------------------------

Employee.hasMany(Leave, {
  foreignKey: "employee_id",
  as: "leaves",
});

Leave.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// Leave approver
Leave.belongsTo(Employee, {
  foreignKey: "approved_by",
  as: "approver",
});

// USER → AUDIT LOGS
User.hasMany(AuditLog, {
  foreignKey: "user_id",
  as: "auditLogs",
});

AuditLog.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

module.exports = {
  sequelize,
  Role,
  User,
  Department,
  Employee,
  Attendance,
  Payroll,
  Leave,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  AuditLog,
};