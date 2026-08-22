import { describe, expect, it } from "vitest";

import { dollarsToMinor, formatUsdMinor } from "./money";

describe("money", () => {
  it("stores exact integer minor units", () => {
    expect(dollarsToMinor("5")).toBe(500n);
    expect(dollarsToMinor("19.95")).toBe(1_995n);
  });
  it("rejects sub-minimum and overly precise values", () => {
    expect(() => dollarsToMinor("4.99")).toThrow("minimum");
    expect(() => dollarsToMinor("5.001")).toThrow("valid");
  });
  it("formats whole and fractional dollars", () => {
    expect(formatUsdMinor(500n)).toBe("$5");
    expect(formatUsdMinor(1_995n)).toBe("$19.95");
  });
});
