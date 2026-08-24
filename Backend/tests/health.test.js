const request = require("supertest");
const app = require("../src/app");

describe("Backend health", () => {
  test("GET /health", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("healthy");
  });
});
