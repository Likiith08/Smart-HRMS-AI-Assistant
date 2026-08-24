"use strict";

const { Op } = require("sequelize");
const {
  LeaveBalance,
  LeaveType,
  LeaveRequest,
  Attendance,
  Payroll,
  Employee,
  Department,
  User,
  Role,
} = require("../models");

const todayStr = () => new Date().toISOString().slice(0, 10);

const detectIntent = (message) => {
  const text = String(message || "").toLowerCase();
  if (/how many (users|accounts)|user role distribution|role distribution|users? (are )?in the system/.test(text)) return "USERS";
  if (/how many employees (are )?(in|on) my team|my team|team.?s (attendance|payroll|department)|who is absent|team size/.test(text)) return "TEAM";
  if (/department.?wise|department statistics|department distribution|which department/.test(text)) return "DEPARTMENTS";
  if (/pending (leave )?requests?|leave requests? (that )?need|awaiting approval|which leave requests/.test(text)) return "PENDING_LEAVE";
  if (/audit|recent activity|login activity|recent (employee|user) changes|system activity/.test(text)) return "AUDIT";
  if (/how many employees|active employees|employee count|headcount/.test(text)) return "EMPLOYEE_COUNT";
  if (/leave|vacation|holiday|time off|casual|sick|earned/.test(text)) return "LEAVE";
  if (/attendance|punch|check.?in|check.?out|working hours|present|absent/.test(text)) return "ATTENDANCE";
  if (/payroll|salary|payslip|pay slip|\bpay\b/.test(text)) return "PAYROLL";
  if (/joining date|when did i join/.test(text)) return "EMPLOYEE";
  if (/who is my manager|my manager/.test(text)) return "EMPLOYEE";
  if (/my department|which department am i/.test(text)) return "EMPLOYEE";
  if (/employee|staff|designation/.test(text)) return "EMPLOYEE";
  if (/policy|policies|hr rule|work from home|wfh|notice period|workflow/.test(text)) return "POLICY";
  if (/help|hello|hi|hey|what can you do/.test(text)) return "GENERAL";
  return "UNKNOWN";
};

// ------------------------------------------------------------------
// Context builders. Every query here is scoped by the requester's own
// role/employee_id so the assistant never leaks another person's data.
// ------------------------------------------------------------------

const buildPersonalContext = async (employeeId) => {
  if (!employeeId) return {};

  const [employee, balances, attendance, payroll] = await Promise.all([
    Employee.findByPk(employeeId, {
      attributes: ["employee_id", "employee_code", "first_name", "last_name", "designation", "department_id", "joining_date", "manager_id"],
      include: [
        { model: Department, as: "department", attributes: ["department_name"] },
        { model: Employee, as: "manager", attributes: ["first_name", "last_name"] },
      ],
    }),
    LeaveBalance.findAll({
      where: { employee_id: employeeId, year: new Date().getFullYear() },
      include: [{ model: LeaveType, as: "leaveType", attributes: ["leave_name"] }],
      attributes: ["total_days", "used_days", "remaining_days", "year"],
    }),
    Attendance.findOne({
      where: { employee_id: employeeId, attendance_date: todayStr() },
      attributes: ["attendance_date", "punch_in", "punch_out", "working_hours", "status"],
    }),
    Payroll.findOne({
      where: { employee_id: employeeId },
      order: [["pay_period_end", "DESC"]],
      attributes: ["pay_period_start", "pay_period_end", "basic_salary", "allowances", "deductions", "net_salary", "status", "payment_date"],
    }),
  ]);

  const pendingLeave = employeeId
    ? await LeaveRequest.count({ where: { employee_id: employeeId, status: "PENDING" } })
    : 0;

  return {
    employee: employee?.toJSON() || null,
    leave_balances: balances.map((b) => ({ ...b.toJSON(), leave_name: b.leaveType?.leave_name || null })),
    today_attendance: attendance?.toJSON() || null,
    latest_payroll: payroll?.toJSON() || null,
    pending_leave_count: pendingLeave,
  };
};

const buildTeamContext = async (managerEmployeeId) => {
  if (!managerEmployeeId) return {};

  const teamMembers = await Employee.findAll({
    where: { manager_id: managerEmployeeId, employment_status: "ACTIVE" },
    attributes: ["employee_id", "first_name", "last_name", "designation"],
  });

  const teamIds = teamMembers.map((m) => m.employee_id);
  if (!teamIds.length) {
    return { team_size: 0, team_present_today: 0, team_absent_today: 0, team_pending_leave: 0 };
  }

  const [presentToday, pendingLeave] = await Promise.all([
    Attendance.count({ where: { employee_id: { [Op.in]: teamIds }, attendance_date: todayStr(), status: { [Op.in]: ["PRESENT", "WFH", "REGULARIZED"] } } }),
    LeaveRequest.count({ where: { employee_id: { [Op.in]: teamIds }, status: "PENDING" } }),
  ]);

  return {
    team_size: teamIds.length,
    team_present_today: presentToday,
    team_absent_today: teamIds.length - presentToday,
    team_pending_leave: pendingLeave,
  };
};

const buildOrgContext = async (role) => {
  // Only HR/ADMIN reach here (enforced by caller); keep queries lightweight.
  const [activeEmployees, totalEmployees, pendingLeave, presentToday, departmentCounts] = await Promise.all([
    Employee.count({ where: { employment_status: "ACTIVE" } }),
    Employee.count(),
    LeaveRequest.count({ where: { status: "PENDING" } }),
    Attendance.count({ where: { attendance_date: todayStr(), status: { [Op.in]: ["PRESENT", "WFH", "REGULARIZED"] } } }),
    Department.findAll({
      attributes: ["department_id", "department_name"],
      include: [{ model: Employee, as: "employees", attributes: ["employee_id"] }],
    }),
  ]);

  const context = {
    active_employees: activeEmployees,
    total_employees: totalEmployees,
    org_pending_leave: pendingLeave,
    org_present_today: presentToday,
    departments: departmentCounts.map((d) => ({ name: d.department_name, employee_count: d.employees?.length || 0 })),
  };

  if (role === "ADMIN") {
    const [totalUsers, roleRows] = await Promise.all([
      User.count(),
      Role.findAll({ attributes: ["role_name"], include: [{ model: User, as: "users", attributes: ["user_id"] }] }),
    ]);
    context.total_users = totalUsers;
    context.role_distribution = roleRows.map((r) => ({ role: r.role_name, count: r.users?.length || 0 }));
  }

  return context;
};

const buildContext = async (user) => {
  const employeeId = user?.employee_id;
  const role = user?.role;

  const context = await buildPersonalContext(employeeId).catch(() => ({}));

  try {
    if (role === "MANAGER" && employeeId) {
      Object.assign(context, await buildTeamContext(employeeId));
    } else if (role === "HR" || role === "ADMIN") {
      Object.assign(context, await buildOrgContext(role));
    }
  } catch (error) {
    console.warn("AI org/team context lookup failed; continuing with personal context only:", error.message);
  }

  return context;
};

const fallbackResponse = (intent, context, role) => {
  if (intent === "LEAVE") {
    const balances = context.leave_balances || [];
    if (!balances.length) return "I could not find a configured leave balance for your profile.";
    const summary = balances.map((b) => `${b.leave_name}: ${b.remaining_days} days remaining`).join("; ");
    return `Your current leave balances are: ${summary}.`;
  }

  if (intent === "ATTENDANCE") {
    const a = context.today_attendance;
    if (!a) return "There is no attendance record for today yet. You can use Punch In to start your attendance.";
    return `Today's attendance is ${a.status}. Punch in: ${a.punch_in || "not recorded"}; punch out: ${a.punch_out || "not recorded"}; working hours: ${a.working_hours ?? "not calculated"}.`;
  }

  if (intent === "PAYROLL") {
    const p = context.latest_payroll;
    if (!p) return "No payroll record is available for your profile yet.";
    return `Your latest payroll is for ${p.pay_period_start} to ${p.pay_period_end}. Net salary: ${p.net_salary}. Status: ${p.status}.`;
  }

  if (intent === "EMPLOYEE") {
    const e = context.employee;
    if (!e) return "I could not find your employee profile.";
    return `You are ${e.first_name} ${e.last_name}, ${e.designation} in ${e.department?.department_name || "your department"}. Joining date: ${e.joining_date}. Manager: ${e.manager ? `${e.manager.first_name} ${e.manager.last_name}` : "not assigned"}.`;
  }

  if (intent === "TEAM") {
    if (role !== "MANAGER" || context.team_size === undefined) {
      return "Team-level information is only available to managers for their own direct reports.";
    }
    return `Your team has ${context.team_size} member(s). Present today: ${context.team_present_today}. Absent today: ${context.team_absent_today}. Pending leave requests awaiting your review: ${context.team_pending_leave}.`;
  }

  if (intent === "PENDING_LEAVE") {
    if (role === "MANAGER") return `You have ${context.team_pending_leave ?? 0} pending leave request(s) from your team awaiting approval.`;
    if (role === "HR" || role === "ADMIN") return `There are ${context.org_pending_leave ?? 0} pending leave request(s) across the organization.`;
    return `You have ${context.pending_leave_count ?? 0} pending leave request(s) of your own.`;
  }

  if (intent === "EMPLOYEE_COUNT") {
    if (role === "HR" || role === "ADMIN") return `There are ${context.active_employees ?? 0} active employees out of ${context.total_employees ?? 0} total employee records.`;
    if (role === "MANAGER") return `Your team has ${context.team_size ?? 0} member(s).`;
    return "Employee headcount is only available to HR, Admin or Manager roles.";
  }

  if (intent === "DEPARTMENTS") {
    if (!context.departments) return "Department statistics are only available to HR and Admin roles.";
    const summary = context.departments.map((d) => `${d.name}: ${d.employee_count}`).join("; ");
    return `Department-wise employee count: ${summary || "no departments configured"}.`;
  }

  if (intent === "USERS") {
    if (role !== "ADMIN" || context.total_users === undefined) return "User account statistics are only available to Admin.";
    const dist = (context.role_distribution || []).map((r) => `${r.role}: ${r.count}`).join("; ");
    return `There are ${context.total_users} user account(s) in the system. Role distribution — ${dist || "no roles configured"}.`;
  }

  if (intent === "AUDIT") return "You can review the full activity trail on the Audit Logs page, which lists recent actions such as logins, attendance, leave and payroll events.";

  if (intent === "POLICY") return "I can help with leave, attendance, payroll, employee information and common HR workflows. For company-specific policy text, use the HR policy documents configured by your organization.";

  if (intent === "GENERAL") return "Hi! I am the MY HRMS Assistant. Ask me about leave balance, attendance, payroll/payslips, employees or HR workflows relevant to your role.";

  return "I can help with leave, attendance, payroll, employee information and HR workflows. Please rephrase your question.";
};

const chat = async ({ message, user }) => {
  const intent = detectIntent(message);
  let context = {};
  try {
    context = await buildContext(user);
  } catch (error) {
    console.warn("AI context lookup failed; continuing without HR data:", error.message);
  }

  const url = `${process.env.FASTAPI_URL || "http://localhost:8000"}/api/v1/assistant/chat`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, intent, context, user: { role: user?.role, employee_id: user?.employee_id } }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      return { ...data, source: "fastapi" };
    }
  } catch (error) {
    console.warn("FastAPI unavailable; using local HR assistant fallback:", error.message);
  }

  return {
    success: true,
    intent,
    response: fallbackResponse(intent, context, user?.role),
    source: "node-fallback",
    context_available: Object.keys(context).length > 0,
  };
};

const health = async () => {
  const base = process.env.FASTAPI_URL || "http://localhost:8000";
  try {
    const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) });
    return { available: response.ok, url: base };
  } catch (error) {
    return { available: false, url: base, error: error.message };
  }
};

module.exports = { detectIntent, buildContext, chat, health };
