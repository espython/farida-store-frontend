export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

export const directionOf = (locale: Locale): "ltr" | "rtl" =>
  locale === "ar" ? "rtl" : "ltr";

/** Separator between list items in running text ("Dokki، Giza" / "Dokki, Giza"). */
export const listSeparator = (locale: string): string => (locale === "ar" ? "، " : ", ");
