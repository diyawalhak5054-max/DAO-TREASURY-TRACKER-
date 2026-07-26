// format.ts
// Small formatting helpers shared across pages. Kept dependency-free.

const E8S_PER_ICP = 100_000_000n;

/** Converts a raw e8s bigint to a human-readable ICP string, e.g. 12.34560000 */
export function e8sToIcp(e8s: bigint, decimals = 4): string {
  const whole = e8s / E8S_PER_ICP;
  const frac = e8s % E8S_PER_ICP;
  const fracStr = frac.toString().padStart(8, "0").slice(0, decimals);
  return `${whole.toString()}.${fracStr}`;
}

/** Converts a user-entered ICP amount (string) to e8s bigint. Throws on invalid input. */
export function icpToE8s(amount: string): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid positive number");
  }
  const [wholePart, fracPart = ""] = trimmed.split(".");
  const paddedFrac = (fracPart + "00000000").slice(0, 8);
  return BigInt(wholePart) * E8S_PER_ICP + BigInt(paddedFrac || "0");
}

export function formatUsd(icpAmount: number, icpToUsdRate: number): string {
  return (icpAmount * icpToUsdRate).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / 1_000_000n);
  return new Date(ms).toLocaleString();
}

export function shortPrincipal(text: string, chars = 6): string {
  if (text.length <= chars * 2 + 3) return text;
  return `${text.slice(0, chars)}...${text.slice(-chars)}`;
}
