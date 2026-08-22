export type Rankable = {
  id: string;
  totalAmountMinor: bigint | string;
  firstPaidAt: Date | string | null;
};

export function rankListings<T extends Rankable>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const amountA = BigInt(a.totalAmountMinor);
    const amountB = BigInt(b.totalAmountMinor);
    if (amountA !== amountB) return amountA > amountB ? -1 : 1;

    const timeA = a.firstPaidAt ? new Date(a.firstPaidAt).getTime() : Number.MAX_SAFE_INTEGER;
    const timeB = b.firstPaidAt ? new Date(b.firstPaidAt).getTime() : Number.MAX_SAFE_INTEGER;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });
}
