import { describe, expect, it } from "vitest";

import { rankListings } from "./ranking";

describe("rankListings", () => {
  it("sorts high total first and keeps the earlier equal bid", () => {
    const ranked = rankListings([
      { id: "later", totalAmountMinor: 500n, firstPaidAt: "2026-08-21T00:00:00Z" },
      { id: "leader", totalAmountMinor: 900n, firstPaidAt: "2026-08-22T00:00:00Z" },
      { id: "earlier", totalAmountMinor: 500n, firstPaidAt: "2026-08-20T00:00:00Z" },
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["leader", "earlier", "later"]);
  });
});
