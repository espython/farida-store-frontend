import { Money } from "@/shared/kernel/Money";

/**
 * Display a legacy decimal amount (the MobX cart and Strapi orders keep EGP as floats)
 * the same way as Money: "3,490", "349.50".
 */
export const formatAmount = (major: number | string): string => {
  const n = typeof major === "string" ? Number(major) : major;
  if (!Number.isFinite(n)) return String(major);
  return Money.toDisplay(Money.fromDecimal(Math.abs(n).toFixed(2)));
};
