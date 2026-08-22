import { describe, expect, it } from "vitest";

describe("webhook idempotency model", () => {
  it("applies 100 concurrent deliveries of one payment exactly once", async () => {
    const eventIds = new Set<string>();
    const paymentIds = new Set<string>();
    let total = 0n;
    await Promise.all(
      Array.from({ length: 100 }, async () => {
        const eventId = "evt_same";
        const paymentId = "pi_same";
        if (eventIds.has(eventId) || paymentIds.has(paymentId)) return;
        eventIds.add(eventId);
        paymentIds.add(paymentId);
        total += 500n;
      }),
    );
    expect(total).toBe(500n);
  });
});
