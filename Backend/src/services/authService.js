"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Role, Employee } = require("../models");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

const registerUser = async ({ username, email, password, role_id, employee_id = null }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedUsername = String(username).trim();

  const [existingUser, existingUsername] = await Promise.all([
    User.findOne({ where: { email: normalizedEmail } }),
    User.findOne({ where: { username: normalizedUsername } }),
  ]);

  if (existingUser) throw new Error("User with this email already exists");
  if (existingUsername) throw new Error("Username is already taken");

  const role = await Role.findByPk(Number(role_id));
  if (!role) throw new Error("Invalid role");

  if (employee_id != null) {
    const employee = await Employee.findByPk(Number(employee_id));
    if (!employee) throw new Error("Invalid employee");
  }

  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password_hash,
    role_id: Number(role_id),
    employee_id: employee_id == null ? null : Number(employee_id),
    status: "ACTIVE",
  });

  return {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    role_id: user.role_id,
    employee_id: user.employee_id,
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    where: { email: String(email).trim().toLowerCase() },
    include: [{ model: Role, as: "role", attributes: ["role_id", "role_name"] }],
  });

  if (!user) throw new Error("Invalid email or password");
  if (user.status !== "ACTIVE") throw new Error("User account is not active");

  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) throw new Error("Invalid email or password");

  return {
    user: {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role: user.role?.role_name,
      employee_id: user.employee_id,
    },
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new Error("Refresh token is required");

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findByPk(decoded.user_id, {
    include: [{ model: Role, as: "role", attributes: ["role_id", "role_name"] }],
  });

  if (!user || user.status !== "ACTIVE") throw new Error("User account is not active");
  return { accessToken: generateAccessToken(user) };
};

module.exports = { registerUser, loginUser, refreshAccessToken };
