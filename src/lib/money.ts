const MIN_BID_MINOR = 500n;
const MAX_BID_MINOR = 10_000_000n;

export function dollarsToMinor(value: string | number): bigint {
  const normalized = typeof value === "number" ? value.toFixed(2) : value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Enter a valid dollar amount with up to two decimal places.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (amount < MIN_BID_MINOR) throw new Error("The minimum bid is $5.");
  if (amount > MAX_BID_MINOR) throw new Error("The maximum bid is $100,000.");
  return amount;
}

export function formatUsdMinor(value: bigint | string | number): string {
  const amount = typeof value === "bigint" ? value : BigInt(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 100n === 0n ? 0 : 2,
  }).format(Number(amount) / 100);
}
