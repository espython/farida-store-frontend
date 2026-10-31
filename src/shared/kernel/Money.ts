import { AppError } from "./AppError";

export type Currency = "EGP";

/** Integer minor units (piastres for EGP) plus currency. Never floats. */
export interface Money {
  readonly amount: number;
  readonly currency: Currency;
}

const FRACTION_DIGITS = 2;
const DECIMAL_RE = /^(-)?(\d+)(?:\.(\d+))?$/;

const invalid = (input: unknown) =>
  new AppError("invalid_money", `Invalid money value: ${String(input)}`, 500);

function assertSameCurrency(a: Money, b: Money) {
  if (a.currency !== b.currency) {
    throw new AppError("invalid_money", "Currency mismatch", 500);
  }
}

export const Money = {
  of(amount: number, currency: Currency = "EGP"): Money {
    if (!Number.isSafeInteger(amount)) throw invalid(amount);
    return { amount, currency };
  },

  zero(currency: Currency = "EGP"): Money {
    return { amount: 0, currency };
  },

  /** Woo REST v3 style decimal string, e.g. "800.00" or "349.5". */
  fromDecimal(value: string | number, currency: Currency = "EGP"): Money {
    const text = typeof value === "number" ? String(value) : value.trim();
    const match = DECIMAL_RE.exec(text);
    if (!match) throw invalid(value);
    const [, sign, whole, fraction = ""] = match;
    const padded = fraction.padEnd(FRACTION_DIGITS + 1, "0");
    let minor = Number(whole) * 10 ** FRACTION_DIGITS + Number(padded.slice(0, FRACTION_DIGITS));
    // Round half up on the first dropped digit.
    if (Number(padded[FRACTION_DIGITS]) >= 5) minor += 1;
    return Money.of(sign ? -minor : minor, currency);
  },

  /** Woo Store API style integer string in minor units, e.g. "80000". */
  fromMinorUnits(value: string | number, currency: Currency = "EGP"): Money {
    const n = typeof value === "number" ? value : Number(value.trim() === "" ? NaN : value);
    return Money.of(n, currency);
  },

  toDecimal(money: Money): string {
    const abs = Math.abs(money.amount);
    const whole = Math.floor(abs / 10 ** FRACTION_DIGITS);
    const fraction = String(abs % 10 ** FRACTION_DIGITS).padStart(FRACTION_DIGITS, "0");
    return `${money.amount < 0 ? "-" : ""}${whole}.${fraction}`;
  },

  /**
   * Shop display amount: thousands separators, Western digits in every locale, and
   * piastres only when there are any ("3,490", "349.50").
   */
  toDisplay(money: Money): string {
    const [whole, fraction] = Money.toDecimal(money).split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fraction === "00" ? grouped : `${grouped}.${fraction}`;
  },

  add(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return Money.of(a.amount + b.amount, a.currency);
  },

  subtract(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return Money.of(a.amount - b.amount, a.currency);
  },

  multiply(money: Money, quantity: number): Money {
    if (!Number.isInteger(quantity)) throw invalid(quantity);
    return Money.of(money.amount * quantity, money.currency);
  },

  /** percent is 0-100; rounds half up to a whole minor unit. */
  percentOff(money: Money, percent: number): Money {
    const clamped = Math.min(100, Math.max(0, percent));
    const off = Math.round((money.amount * clamped) / 100);
    return Money.of(money.amount - off, money.currency);
  },

  equals(a: Money, b: Money): boolean {
    return a.currency === b.currency && a.amount === b.amount;
  },
};
