const { Payroll, Employee } = require("../models");

const createPayroll = async (data) => {
  const {
    employee_id,
    pay_period_start,
    pay_period_end,
    basic_salary,
    allowances = 0,
    deductions = 0,
    payment_date,
    remarks,
  } = data;

  const employee = await Employee.findByPk(employee_id);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const net_salary =
    Number(basic_salary) +
    Number(allowances) -
    Number(deductions);

  return Payroll.create({
    employee_id,
    pay_period_start,
    pay_period_end,
    basic_salary,
    allowances,
    deductions,
    net_salary,
    status: "DRAFT",
    payment_date: payment_date || null,
    remarks: remarks || null,
  });
};

const getPayrolls = async () => {
  return Payroll.findAll({
    include: [
      {
        model: Employee,
        as: "employee",
        attributes: [
          "employee_id",
          "employee_code",
          "first_name",
          "last_name",
          "designation",
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

const getPayrollById = async (payroll_id) => {
  const payroll = await Payroll.findByPk(payroll_id, {
    include: [
      {
        model: Employee,
        as: "employee",
        attributes: [
          "employee_id",
          "employee_code",
          "first_name",
          "last_name",
          "designation",
        ],
      },
    ],
  });

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  return payroll;
};

const processPayroll = async (payroll_id) => {
  const payroll = await Payroll.findByPk(payroll_id);

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  await payroll.update({
    status: "PROCESSED",
  });

  return payroll;
};

const markPayrollPaid = async (payroll_id, payment_date) => {
  const payroll = await Payroll.findByPk(payroll_id);

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  await payroll.update({
    status: "PAID",
    payment_date: payment_date || new Date(),
  });

  return payroll;
};

module.exports = {
  createPayroll,
  getPayrolls,
  getPayrollById,
  processPayroll,
  markPayrollPaid,
};