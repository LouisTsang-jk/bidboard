import { describe, expect, it } from "vitest";

import { normalizePublicUrl } from "./url";

describe("normalizePublicUrl", () => {
  it("normalizes host, tracking parameters, and trailing slash", () => {
    expect(normalizePublicUrl("HTTPS://WWW.Example.com/path/?utm_source=x&b=2&a=1#top"))
      .toBe("https://www.example.com/path?a=1&b=2");
  });
  it("blocks local network destinations", () => {
    expect(() => normalizePublicUrl("http://127.0.0.1:3000/admin")).toThrow("Private-network");
    expect(() => normalizePublicUrl("http://192.168.1.1")).toThrow("Private-network");
  });
});
