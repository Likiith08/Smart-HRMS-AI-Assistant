const { detectIntent } = require("../src/services/aiService");

describe("HR AI intent detection", () => {
  test("detects leave questions", () => {
    expect(detectIntent("How many sick leave days do I have?")).toBe("LEAVE");
  });
  test("detects attendance questions", () => {
    expect(detectIntent("Did I punch in today?")).toBe("ATTENDANCE");
  });
  test("detects payroll questions", () => {
    expect(detectIntent("Show my latest payslip")).toBe("PAYROLL");
  });
});
