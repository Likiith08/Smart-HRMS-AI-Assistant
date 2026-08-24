const { Attendance, Employee } = require("../models");
const auditService = require("../services/auditService");

const punchIn = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to an employee",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    let attendance = await Attendance.findOne({
      where: {
        employee_id: employeeId,
        attendance_date: today,
      },
    });

    if (attendance && attendance.punch_in) {
      return res.status(400).json({
        success: false,
        message: "Already punched in today",
      });
    }

    if (!attendance) {
      attendance = await Attendance.create({
        employee_id: employeeId,
        attendance_date: today,
        punch_in: new Date(),
        status: "PRESENT",
      });
    } else {
      await attendance.update({
        punch_in: new Date(),
        status: "PRESENT",
      });
    }

    auditService.log({
      userId: req.user.user_id,
      action: "ATTENDANCE_PUNCH_IN",
      entityType: "ATTENDANCE",
      entityId: attendance.attendance_id,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Punch in successful",
      data: attendance,
    });
  } catch (error) {
    console.error("Punch in error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to punch in",
    });
  }
};

const punchOut = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({
      where: {
        employee_id: employeeId,
        attendance_date: today,
      },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "Please punch in first",
      });
    }

    if (!attendance.punch_in) {
      return res.status(400).json({
        success: false,
        message: "Please punch in first",
      });
    }

    if (attendance.punch_out) {
      return res.status(400).json({
        success: false,
        message: "Already punched out today",
      });
    }

    const punchOutTime = new Date();
    const punchInTime = new Date(attendance.punch_in);

    const workingHours =
      (punchOutTime - punchInTime) / (1000 * 60 * 60);

    await attendance.update({
      punch_out: punchOutTime,
      working_hours: Number(workingHours.toFixed(2)),
    });

    auditService.log({
      userId: req.user.user_id,
      action: "ATTENDANCE_PUNCH_OUT",
      entityType: "ATTENDANCE",
      entityId: attendance.attendance_id,
      details: { working_hours: attendance.working_hours },
      req,
    });

    res.status(200).json({
      success: true,
      message: "Punch out successful",
      data: attendance,
    });
  } catch (error) {
    console.error("Punch out error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to punch out",
    });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({
      where: {
        employee_id: employeeId,
        attendance_date: today,
      },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "employee_id",
            "employee_code",
            "first_name",
            "last_name",
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Today's attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch today's attendance",
    });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const employeeFilter = req.user?.role === "MANAGER"
      ? { manager_id: req.user.employee_id }
      : undefined;

    const attendance = await Attendance.findAll({
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "employee_id",
            "employee_code",
            "first_name",
            "last_name",
          ],
          ...(employeeFilter ? { where: employeeFilter, required: true } : {}),
        },
      ],
      order: [["attendance_date", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Get all attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records",
    });
  }
};

module.exports = {
  punchIn,
  punchOut,
  getTodayAttendance,
  getAllAttendance,
};