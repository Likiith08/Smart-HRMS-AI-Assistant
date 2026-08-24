"use strict";

const { Op } = require("sequelize");

const {
  User,
  Role,
  Employee,
  Department,
} = require("../models");

const auditService = require("../services/auditService");


// ============================================================
// GET ALL USERS - ADMIN ONLY
// ============================================================
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "user_id",
        "username",
        "email",
        "role_id",
        "employee_id",
        "status",
        "created_at",
        "updated_at",
      ],

      include: [
        {
          model: Role,
          as: "role",
          attributes: [
            "role_id",
            "role_name",
            "description",
          ],
        },

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

      order: [["created_at", "DESC"]],
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};


// ============================================================
// GET MY PROFILE
// ============================================================
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findByPk(userId, {
      attributes: [
        "user_id",
        "username",
        "email",
        "role_id",
        "employee_id",
        "status",
        "created_at",
        "updated_at",
      ],

      include: [
        {
          model: Role,
          as: "role",
          attributes: [
            "role_id",
            "role_name",
            "description",
          ],
        },

        {
          model: Employee,
          as: "employee",
          attributes: [
            "employee_id",
            "employee_code",
            "first_name",
            "last_name",
            "email",
            "phone",
            "designation",
            "employment_status",
          ],

          include: [
            {
              model: Department,
              as: "department",
              attributes: [
                "department_id",
                "department_name",
                "description",
              ],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};


// ============================================================
// UPDATE MY PROFILE
// ============================================================
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Only phone number can be changed by the logged-in user.
    const { phone } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.employee_id) {
      return res.status(400).json({
        success: false,
        message: "Employee profile is not linked to this user",
      });
    }

    const employee = await Employee.findByPk(user.employee_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    // Only update phone.
    if (phone !== undefined) {
      await employee.update({
        phone: String(phone).trim(),
      });
    }

    auditService.log({
      userId: req.user.user_id,
      action: "PROFILE_UPDATED",
      entityType: "USER",
      entityId: userId,
      details: {
        updatedFields: phone !== undefined ? ["phone"] : [],
      },
      req,
    });

    // Return updated profile
    const updatedUser = await User.findByPk(userId, {
      attributes: [
        "user_id",
        "username",
        "email",
        "role_id",
        "employee_id",
        "status",
        "created_at",
        "updated_at",
      ],

      include: [
        {
          model: Role,
          as: "role",
          attributes: [
            "role_id",
            "role_name",
            "description",
          ],
        },

        {
          model: Employee,
          as: "employee",
          attributes: [
            "employee_id",
            "employee_code",
            "first_name",
            "last_name",
            "email",
            "phone",
            "designation",
            "employment_status",
          ],

          include: [
            {
              model: Department,
              as: "department",
              attributes: [
                "department_id",
                "department_name",
                "description",
              ],
            },
          ],
        },
      ],
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });

  } catch (error) {
    console.error("Update my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};


// ============================================================
// UPDATE USER ROLE - ADMIN ONLY
// ============================================================
const updateUserRole = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const roleId = Number(req.body.role_id);

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: "role_id is required",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const role = await Role.findByPk(roleId);

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const oldRoleId = user.role_id;

    let username = user.username;
    if (user.employee_id) {
      const employee = await Employee.findByPk(user.employee_id);
      if (employee) {
        const baseUsername = `${String(employee.first_name).trim().toLowerCase().replace(/\s+/g, "-")}.${String(role.role_name).trim().toLowerCase()}`;
        username = baseUsername;
        let suffix = 2;
        while (await User.findOne({ where: { username, user_id: { [Op.ne]: user.user_id } } })) {
          username = `${baseUsername}${suffix}`;
          suffix += 1;
        }
      }
    }

    await user.update({
      role_id: roleId,
      username,
    });

    auditService.log({
      userId: req.user.user_id,
      action: "USER_ROLE_CHANGED",
      entityType: "USER",
      entityId: userId,
      details: {
        oldRoleId,
        newRoleId: roleId,
      },
      req,
    });

    return res.json({
      success: true,
      message: "User role updated successfully",
      data: {
        user_id: user.user_id,
        role_id: role.role_id,
        role: role.role_name,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};


// ============================================================
// UPDATE USER STATUS - ADMIN ONLY
// ============================================================
const updateUserStatus = async (req, res) => {
  try {
    const status = String(
      req.body.status || ""
    ).toUpperCase();

    if (
      !["ACTIVE", "INACTIVE", "LOCKED"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be ACTIVE, INACTIVE or LOCKED",
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldStatus = user.status;

    await user.update({
      status,
    });

    auditService.log({
      userId: req.user.user_id,
      action: "USER_STATUS_CHANGED",
      entityType: "USER",
      entityId: user.user_id,
      details: {
        oldStatus,
        newStatus: status,
      },
      req,
    });

    return res.json({
      success: true,
      message: "User status updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  getUsers,
  getMyProfile,
  updateMyProfile,
  updateUserRole,
  updateUserStatus,
};