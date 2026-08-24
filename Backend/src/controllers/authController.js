"use strict";

const authService = require("../services/authService");
const auditService = require("../services/auditService");

const register = async (req, res) => {
  try {
    const { username, email, password, role_id, employee_id } = req.body;

    if (!username || !email || !password || !role_id) {
      return res.status(400).json({ success: false, message: "Username, email, password and role are required" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const user = await authService.registerUser({ username, email, password, role_id, employee_id });
    auditService.log({ userId: user.user_id, action: "USER_REGISTERED", entityType: "USER", entityId: user.user_id, details: { role_id, employee_id }, req });

    return res.status(201).json({ success: true, message: "User registered successfully", data: user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });

    const result = await authService.loginUser({ email, password });
    auditService.log({ userId: result.user.user_id, action: "LOGIN_SUCCESS", entityType: "USER", entityId: result.user.user_id, req });
    return res.status(200).json({ success: true, message: "Login successful", data: result });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, refresh };
