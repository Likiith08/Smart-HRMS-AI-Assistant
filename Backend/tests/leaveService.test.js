const { calculateDays } = require("../src/services/leaveService");

describe("Leave service", () => {
  test("calculates inclusive leave days", () => {
    expect(calculateDays("2026-08-21", "2026-08-23")).toBe(3);
  });
  test("rejects reversed dates", () => {
    expect(() => calculateDays("2026-08-23", "2026-08-21")).toThrow("End date cannot be before start date");
  });
});
