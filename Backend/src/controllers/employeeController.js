const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { sequelize, Employee, Department, User, Role, Attendance, Payroll, Leave, LeaveRequest, LeaveBalance } = require("../models");
const auditService = require("../services/auditService");

const createEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      designation,
      joining_date,
      manager_id,
      account_role_id = 4,
      account_password,
    } = req.body;

    if (
      !employee_code || !first_name || !last_name || !email ||
      !department_id || !designation || !joining_date ||
      !account_password
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Employee details, login role and initial password are required",
      });
    }

    if (String(account_password).length < 8) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Initial password must be at least 8 characters",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const roleId = Number(account_role_id);
    const role = await Role.findByPk(roleId, { transaction });

    if (!role) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Invalid login role" });
    }

    // HR can create employee/manager accounts, while only Admin can create
    // another HR/Admin account. This prevents privilege escalation.
    if (req.user?.role === "HR" && [1, 2].includes(roleId)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "HR can create EMPLOYEE or MANAGER accounts only",
      });
    }

    const department = await Department.findByPk(department_id, { transaction });
    if (!department) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Invalid department" });
    }

    const existingEmployee = await Employee.findOne({
      where: { [Op.or]: [{ employee_code }, { email: normalizedEmail }] },
      transaction,
    });
    if (existingEmployee) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: "Employee code or email already exists" });
    }

    const existingEmailUser = await User.findOne({ where: { email: normalizedEmail }, transaction });
    if (existingEmailUser) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: "A login account already uses this email" });
    }

    if (manager_id) {
      const manager = await Employee.findByPk(manager_id, { transaction });
      if (!manager) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "Invalid manager" });
      }
    }

    const employee = await Employee.create({
      employee_code,
      first_name,
      last_name,
      email: normalizedEmail,
      phone,
      department_id,
      designation,
      joining_date,
      manager_id: manager_id || null,
      employment_status: "ACTIVE",
    }, { transaction });

    const baseUsername = `${String(first_name).trim().toLowerCase().replace(/\s+/g, "-")}.${String(role.role_name).trim().toLowerCase()}`;
    let username = baseUsername;
    let suffix = 2;
    while (await User.findOne({ where: { username }, transaction })) {
      username = `${baseUsername}${suffix}`;
      suffix += 1;
    }

    const password_hash = await bcrypt.hash(String(account_password), 12);
    const user = await User.create({
      username,
      email: normalizedEmail,
      password_hash,
      role_id: roleId,
      employee_id: employee.employee_id,
      status: "ACTIVE",
    }, { transaction });

    await transaction.commit();

    const result = await Employee.findByPk(employee.employee_id, {
      include: [{ model: Department, as: "department", attributes: ["department_id", "department_name"] }],
    });

    auditService.log({
      userId: req.user?.user_id,
      action: "EMPLOYEE_CREATED",
      entityType: "EMPLOYEE",
      entityId: employee.employee_id,
      details: { employee_code, department_id, designation, user_id: user.user_id, role_id: roleId },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Employee created successfully. Login: ${username} / ${normalizedEmail}`,
      data: { employee: result, user: { user_id: user.user_id, username, email: normalizedEmail, role_id: roleId } },
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Create employee error:", error);
    return res.status(500).json({ success: false, message: "Failed to create employee and login account" });
  }
};
const getEmployees = async (req, res) => {
  try {
    const {
      search = "",
      department_id,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(
      Math.max(parseInt(limit, 10) || 10, 1),
      100
    );

    const offset = (pageNumber - 1) * limitNumber;

    const where = {};

    if (search.trim()) {
      where[Op.or] = [
        { employee_code: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (department_id) {
      where.department_id = department_id;
    }

    if (status) {
      where.employment_status = status;
    }

    // Managers only see their direct reports in the team directory.
    if (req.user?.role === "MANAGER") {
      if (!req.user.employee_id) {
        return res.status(400).json({ success: false, message: "Manager is not linked to an employee profile" });
      }
      where.manager_id = req.user.employee_id;
    }

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "department_name"],
        },
        {
          model: Employee,
          as: "manager",
          attributes: ["employee_id", "first_name", "last_name", "designation"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: limitNumber,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(count / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get employees error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "department_name"],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      department_id,
      designation,
      joining_date,
      manager_id,
      employment_status,
    } = req.body;

    if (department_id) {
      const department = await Department.findByPk(department_id);

      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Invalid department",
        });
      }
    }

    if (manager_id) {
      if (Number(manager_id) === Number(employee.employee_id)) {
        return res.status(400).json({
          success: false,
          message: "Employee cannot be their own manager",
        });
      }

      const manager = await Employee.findByPk(manager_id);

      if (!manager) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager",
        });
      }
    }

    const normalizedEmail = email === undefined ? employee.email : String(email).trim().toLowerCase();
    const nextFirstName = first_name === undefined ? employee.first_name : first_name;
    const nextLastName = last_name === undefined ? employee.last_name : last_name;

    const linkedUser = await User.findOne({ where: { employee_id: employee.employee_id }, include: [{ model: Role, as: "role" }] });
    if (linkedUser && normalizedEmail !== linkedUser.email) {
      const emailOwner = await User.findOne({ where: { email: normalizedEmail, user_id: { [Op.ne]: linkedUser.user_id } } });
      if (emailOwner) return res.status(409).json({ success: false, message: "Another login account already uses this email" });
    }

    await employee.update({
      first_name: nextFirstName,
      last_name: nextLastName,
      email: normalizedEmail,
      phone,
      department_id,
      designation,
      joining_date,
      manager_id: manager_id || null,
      employment_status,
    });

    if (linkedUser) {
      const baseUsername = `${String(nextFirstName).trim().toLowerCase().replace(/\s+/g, "-")}.${String(linkedUser.role.role_name).trim().toLowerCase()}`;
      let username = baseUsername;
      let suffix = 2;
      while (await User.findOne({ where: { username, user_id: { [Op.ne]: linkedUser.user_id } } })) {
        username = `${baseUsername}${suffix}`;
        suffix += 1;
      }
      await linkedUser.update({ email: normalizedEmail, username });
    }

    auditService.log({
      userId: req.user?.user_id,
      action: "EMPLOYEE_UPDATED",
      entityType: "EMPLOYEE",
      entityId: employee.employee_id,
      details: { updatedFields: Object.keys(req.body || {}) },
      req,
    });

    res.json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Update employee error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
};

const deleteEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const employeeId = Number(req.params.id);

    if (req.user?.employee_id && Number(req.user.employee_id) === employeeId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "You cannot delete your own employee profile" });
    }

    const employee = await Employee.findByPk(employeeId, { transaction });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const [attendanceCount, payrollCount, leaveCount, leaveRequestCount, balanceCount] = await Promise.all([
      Attendance.count({ where: { employee_id: employeeId }, transaction }),
      Payroll.count({ where: { employee_id: employeeId }, transaction }),
      Leave.count({ where: { employee_id: employeeId }, transaction }),
      LeaveRequest.count({ where: { employee_id: employeeId }, transaction }),
      LeaveBalance.count({ where: { employee_id: employeeId }, transaction }),
    ]);

    const history = [];
    if (attendanceCount) history.push("attendance");
    if (payrollCount) history.push("payroll");
    if (leaveCount || leaveRequestCount) history.push("leave records");
    if (balanceCount) history.push("leave balances");

    if (history.length) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `This employee has ${history.join(", ")}. Delete is blocked to preserve HR history; deactivate the employee instead.`,
      });
    }

    await User.destroy({ where: { employee_id: employeeId }, transaction });
    await employee.destroy({ transaction });
    await transaction.commit();

    auditService.log({
      userId: req.user?.user_id,
      action: "EMPLOYEE_DELETED",
      entityType: "EMPLOYEE",
      entityId: employeeId,
      details: { employee_code: employee.employee_code },
      req,
    });

    return res.json({ success: true, message: "Employee and login account deleted successfully" });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Delete employee error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete employee" });
  }
};

const deactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await employee.update({
      employment_status: "INACTIVE",
    });

    res.json({
      success: true,
      message: "Employee deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deactivate employee",
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deactivateEmployee,
  deleteEmployee,
};