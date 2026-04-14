import { describe, it, expect } from "vitest";

describe("Health Check", () => {
  it("should pass basic sanity check", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have Node.js environment", () => {
    expect(typeof process).toBe("object");
    expect(process.version).toBeDefined();
  });

  it("should resolve promises", async () => {
    const result = await Promise.resolve("ok");
    expect(result).toBe("ok");
  });
});
