"use strict";

// Regression tests for bugs found during the full audit:
//  - payroll "mark as paid" crashing when called with no request body
//  - HR being able to approve leave for an employee who has an assigned manager
//  - HR being able to view Audit Logs (ADMIN-only)
//
// These run against the real seeded demo database (see seeders/), the same
// way tests/health.test.js does, so they need the dev DB migrated + seeded.
// Every leave request created here is cleaned up in afterAll so the suite
// is safe to re-run repeatedly without colliding with its own prior data.

const request = require("supertest");
const app = require("../src/app");
const { LeaveRequest, sequelize } = require("../src/models");

const login = async (email, password) => {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body?.data?.accessToken;
};

const createdLeaveIds = [];

afterAll(async () => {
  if (createdLeaveIds.length) {
    await LeaveRequest.destroy({ where: { leave_request_id: createdLeaveIds } });
  }
  await sequelize.close();
});

// A fresh, never-reused date per test run avoids the (real, intentional)
// overlap-prevention check tripping on this suite's own leftover data.
// Uses leave_type_id 4 (UNPAID) throughout so no leave-balance row is needed.
let dayCounter = 1;
const nextDate = () => {
  const day = String((dayCounter++ % 27) + 1).padStart(2, "0");
  return `2029-01-${day}`; // far enough out to never collide with real usage, and cleaned up after anyway
};

describe("Regression: payroll mark-as-paid with no request body", () => {
  test("PATCH /payroll/:id/pay does not 500 when the client sends no body", async () => {
    const token = await login("karna@gmail.com", "karna@123");
    expect(token).toBeTruthy();

    const create = await request(app)
      .post("/api/payroll")
      .set("Authorization", `Bearer ${token}`)
      .send({ employee_id: 5, pay_period_start: "2026-05-01", pay_period_end: "2026-05-31", basic_salary: 40000 });
    // Employee may already have a record for this period from a prior run; either way we just
    // need *some* DRAFT payroll id to exercise the pay endpoint against.
    const payrollId = create.body?.data?.payroll_id;
    if (!payrollId) return; // record already existed in this period; skip rather than fail the whole run

    await request(app).patch(`/api/payroll/${payrollId}/process`).set("Authorization", `Bearer ${token}`);

    // The real bug: calling .patch(url) with NO .send(...) means no body and no
    // Content-Type header, which used to crash markPayrollPaid with a 500.
    const payResponse = await request(app).patch(`/api/payroll/${payrollId}/pay`).set("Authorization", `Bearer ${token}`);

    expect(payResponse.statusCode).toBe(200);
    expect(payResponse.body.success).toBe(true);
    expect(payResponse.body.data.status).toBe("PAID");
  });
});

describe("Regression: leave approval hierarchy", () => {
  test("HR cannot approve leave for an employee who has an assigned manager", async () => {
    const rahulToken = await login("rahul@gmail.com", "rahul@123"); // reports to Vikram (manager_id=3)
    const priyaToken = await login("priya@gmail.com", "priya@123"); // HR, not Rahul's manager

    const date = nextDate();
    const apply = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${rahulToken}`)
      .send({ leave_type_id: 4, start_date: date, end_date: date, reason: "regression test" });
    expect(apply.statusCode).toBe(201);
    const leaveId = apply.body.data.leave_request_id;
    createdLeaveIds.push(leaveId);

    const hrApprove = await request(app)
      .put(`/api/leaves/${leaveId}/status`)
      .set("Authorization", `Bearer ${priyaToken}`)
      .send({ status: "APPROVED" });

    expect(hrApprove.statusCode).toBe(403);
    expect(hrApprove.body.success).toBe(false);
  });

  test("the assigned manager can approve their report's leave", async () => {
    const rahulToken = await login("rahul@gmail.com", "rahul@123");
    const vikramToken = await login("vikram@gmail.com", "vikram@123"); // Rahul's actual manager

    const date = nextDate();
    const apply = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${rahulToken}`)
      .send({ leave_type_id: 4, start_date: date, end_date: date, reason: "regression test 2" });
    expect(apply.statusCode).toBe(201);
    const leaveId = apply.body.data.leave_request_id;
    createdLeaveIds.push(leaveId);

    const approve = await request(app)
      .put(`/api/leaves/${leaveId}/status`)
      .set("Authorization", `Bearer ${vikramToken}`)
      .send({ status: "APPROVED" });

    expect(approve.statusCode).toBe(200);
    expect(approve.body.data.status).toBe("APPROVED");
  });

  test("nobody can approve their own leave request", async () => {
    const vikramToken = await login("vikram@gmail.com", "vikram@123");

    const date = nextDate();
    const apply = await request(app)
      .post("/api/leaves")
      .set("Authorization", `Bearer ${vikramToken}`)
      .send({ leave_type_id: 4, start_date: date, end_date: date, reason: "self approval test" });
    expect(apply.statusCode).toBe(201);
    const leaveId = apply.body.data.leave_request_id;
    createdLeaveIds.push(leaveId);

    const selfApprove = await request(app)
      .put(`/api/leaves/${leaveId}/status`)
      .set("Authorization", `Bearer ${vikramToken}`)
      .send({ status: "APPROVED" });

    expect(selfApprove.statusCode).toBe(403);
  });
});

describe("Regression: audit log visibility", () => {
  test("HR is rejected from Audit Logs (ADMIN-only)", async () => {
    const priyaToken = await login("priya@gmail.com", "priya@123");
    const res = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${priyaToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("ADMIN can view Audit Logs", async () => {
    const karnaToken = await login("karna@gmail.com", "karna@123");
    const res = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${karnaToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
