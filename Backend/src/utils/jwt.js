//This centralizes JWT creation so every authentication endpoint uses the same secure token structure and expiry rules.

const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role_id: user.role_id,
      role: user.role?.role_name || user.role,
      employee_id: user.employee_id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role_id: user.role_id,
      role: user.role?.role_name || user.role,
      employee_id: user.employee_id,
      email: user.email,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};