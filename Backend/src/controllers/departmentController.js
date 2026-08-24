const { Department } = require("../models");
const auditService = require("../services/auditService");

const createDepartment = async (req, res) => {
  try {
    const { department_name, description } = req.body;

    if (!department_name) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const existing = await Department.findOne({
      where: { department_name },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

    const department = await Department.create({
      department_name,
      description,
    });

    auditService.log({
      userId: req.user?.user_id,
      action: "DEPARTMENT_CREATED",
      entityType: "DEPARTMENT",
      entityId: department.department_id,
      details: { department_name },
      req,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create department",
    });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      order: [["department_name", "ASC"]],
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};

const getDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch department",
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const { department_name, description } = req.body;

    await department.update({
      department_name,
      description,
    });

    auditService.log({
      userId: req.user?.user_id,
      action: "DEPARTMENT_UPDATED",
      entityType: "DEPARTMENT",
      entityId: department.department_id,
      details: { department_name, description },
      req,
    });

    res.json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update department",
    });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    await department.destroy();

    auditService.log({
      userId: req.user?.user_id,
      action: "DEPARTMENT_DELETED",
      entityType: "DEPARTMENT",
      entityId: department.department_id,
      details: { department_name: department.department_name },
      req,
    });

    res.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Department cannot be deleted because it may contain employees",
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
};