from typing import Any, Dict, Optional
import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="MY HRMS AI Assistant",
    description="Local intent-based AI assistant for MY HRMS. No external AI key is required.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    intent: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    user: Dict[str, Any] = Field(default_factory=dict)


class IntentRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


def detect_intent(message: str) -> str:
    text = message.lower()
    rules = [
        ("USERS", r"how many (users|accounts)|user role distribution|role distribution|users? (are )?in the system"),
        ("TEAM", r"how many employees (are )?(in|on) my team|my team|team.?s (attendance|payroll|department)|who is absent|team size"),
        ("DEPARTMENTS", r"department.?wise|department statistics|department distribution|which department"),
        ("PENDING_LEAVE", r"pending (leave )?requests?|leave requests? (that )?need|awaiting approval|which leave requests"),
        ("AUDIT", r"audit|recent activity|login activity|recent (employee|user) changes|system activity"),
        ("EMPLOYEE_COUNT", r"how many employees|active employees|employee count|headcount"),
        ("LEAVE", r"leave|vacation|holiday|time off|casual|sick|earned"),
        ("ATTENDANCE", r"attendance|punch|check.?in|check.?out|working hours|present|absent"),
        ("PAYROLL", r"payroll|salary|payslip|pay slip|pay"),
        ("EMPLOYEE", r"employee|staff|department|manager|designation"),
        ("POLICY", r"policy|policies|hr rule|work from home|wfh|notice period|workflow"),
        ("GENERAL", r"help|hello|hi|hey|what can you do"),
    ]
    for intent, pattern in rules:
        if re.search(pattern, text):
            return intent
    return "UNKNOWN"


def answer(intent: str, context: Dict[str, Any], role: Optional[str] = None) -> str:
    if intent == "LEAVE":
        balances = context.get("leave_balances", [])
        if not balances:
            return "I could not find a configured leave balance for your profile."
        values = [f"{b.get('leave_name', 'Leave')}: {b.get('remaining_days', 0)} days remaining" for b in balances]
        return "Your current leave balances are: " + "; ".join(values) + "."

    if intent == "ATTENDANCE":
        attendance = context.get("today_attendance")
        if not attendance:
            return "There is no attendance record for today yet. You can use Punch In to start your attendance."
        return (
            f"Today's attendance is {attendance.get('status', 'UNKNOWN')}. "
            f"Punch in: {attendance.get('punch_in') or 'not recorded'}; "
            f"punch out: {attendance.get('punch_out') or 'not recorded'}; "
            f"working hours: {attendance.get('working_hours') if attendance.get('working_hours') is not None else 'not calculated'}."
        )

    if intent == "PAYROLL":
        payroll = context.get("latest_payroll")
        if not payroll:
            return "No payroll record is available for your profile yet."
        return (
            f"Your latest payroll is for {payroll.get('pay_period_start')} to {payroll.get('pay_period_end')}. "
            f"Net salary: {payroll.get('net_salary')}. Status: {payroll.get('status')}."
        )

    if intent == "POLICY":
        return "I can help with leave, attendance, payroll, employee information and common HR workflows. For company-specific policy text, use the HR policy documents configured by your organization."

    if intent == "EMPLOYEE":
        employee = context.get("employee") or {}
        if employee:
            return f"Your profile is {employee.get('first_name', '')} {employee.get('last_name', '')}, {employee.get('designation', '')}, employee code {employee.get('employee_code', '')}."
        return "I can help with employee-related HR workflows."

    if intent == "TEAM":
        if role != "MANAGER" or context.get("team_size") is None:
            return "Team-level information is only available to managers for their own direct reports."
        return (
            f"Your team has {context.get('team_size', 0)} member(s). "
            f"Present today: {context.get('team_present_today', 0)}. "
            f"Absent today: {context.get('team_absent_today', 0)}. "
            f"Pending leave requests awaiting your review: {context.get('team_pending_leave', 0)}."
        )

    if intent == "PENDING_LEAVE":
        if role == "MANAGER":
            return f"You have {context.get('team_pending_leave', 0)} pending leave request(s) from your team awaiting approval."
        if role in ("HR", "ADMIN"):
            return f"There are {context.get('org_pending_leave', 0)} pending leave request(s) across the organization."
        return f"You have {context.get('pending_leave_count', 0)} pending leave request(s) of your own."

    if intent == "EMPLOYEE_COUNT":
        if role in ("HR", "ADMIN"):
            return f"There are {context.get('active_employees', 0)} active employees out of {context.get('total_employees', 0)} total employee records."
        if role == "MANAGER":
            return f"Your team has {context.get('team_size', 0)} member(s)."
        return "Employee headcount is only available to HR, Admin or Manager roles."

    if intent == "DEPARTMENTS":
        departments = context.get("departments")
        if not departments:
            return "Department statistics are only available to HR and Admin roles."
        summary = "; ".join(f"{d.get('name')}: {d.get('employee_count', 0)}" for d in departments)
        return f"Department-wise employee count: {summary or 'no departments configured'}."

    if intent == "USERS":
        if role != "ADMIN" or context.get("total_users") is None:
            return "User account statistics are only available to Admin."
        dist = "; ".join(f"{r.get('role')}: {r.get('count', 0)}" for r in context.get("role_distribution", []))
        return f"There are {context.get('total_users', 0)} user account(s) in the system. Role distribution — {dist or 'no roles configured'}."

    if intent == "AUDIT":
        return "You can review the full activity trail on the Audit Logs page, which lists recent actions such as logins, attendance, leave and payroll events."

    if intent == "GENERAL":
        return "Hi! I am the MY HRMS Assistant. Ask me about leave balance, attendance, payroll/payslips, employees or HR workflows relevant to your role."

    return "I can help with leave, attendance, payroll, employee information and HR workflows. Please rephrase your question."


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "MY HRMS AI Assistant", "mode": "local-intent"}


@app.post("/api/v1/assistant/intent")
def classify(request: IntentRequest):
    return {"success": True, "intent": detect_intent(request.message)}


@app.post("/api/v1/assistant/chat")
def chat(request: ChatRequest):
    intent = (request.intent or detect_intent(request.message)).upper()
    role = (request.user or {}).get("role")
    return {
        "success": True,
        "intent": intent,
        "response": answer(intent, request.context, role),
        "source": "fastapi-local",
    }
