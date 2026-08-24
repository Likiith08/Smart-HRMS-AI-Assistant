const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const userRoutes = require("./routes/userRoutes");
const auditRoutes = require("./routes/auditRoutes");
const aiRoutes = require("./routes/aiRoutes");



const app = express();

// Security headers
app.use(helmet());

// Allow frontend/backend communication
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
    })
);

// Parse JSON request bodies /middleware
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Some clients (including our own frontend's action buttons, e.g. "mark
// payroll as paid") issue POST/PATCH requests with no body and no
// Content-Type header. express.json()/urlencoded() then leave req.body as
// `undefined` rather than `{}`, which crashes any controller that reads
// req.body.<field> directly. Normalize it here so every controller can
// safely assume req.body is at least an empty object.
app.use((req, res, next) => {
    if (req.body === undefined) req.body = {};
    next();
});

// HTTP request logging
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

// Basic API rate limiting (registered before API routes).
// IMPORTANT: this must NOT share a budget with /api/auth/login, or normal SPA
// usage (dashboard widgets, polling, multiple tabs/roles during testing) can
// exhaust the shared counter and then block legitimate logins with 429 for
// the rest of the window. Auth gets its own generous, brute-force-aware
// limiter below; this general limiter only protects the rest of the API and
// is sized for a real multi-widget dashboard, not just a handful of clicks.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    // Login/refresh/register are handled by their own limiter — never double-count them here.
    skip: (req) => req.path.startsWith("/auth"),
});
app.use("/api", limiter);

// Login-specific limiter: generous enough that a real user typing their
// password wrong a couple of times, or a page issuing one duplicate request
// (React StrictMode, a double-click), never gets blocked — but still caps
// brute-force guessing. Only failed attempts count against the limit.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { success: false, message: "Too many login attempts. Please wait a few minutes and try again." },
});
app.use("/api/auth/login", loginLimiter);


app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/ai", aiRoutes);


// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "MY HRMS Backend"
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.statusCode || 500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal server error"
                : err.message
    });
});

module.exports = app;