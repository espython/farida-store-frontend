import type { Locale } from "@/shared/kernel/Locale";

export interface Color {
  id: string;
  slug: string;
  name: string;
  /** "#rrggbb" or null when the term has no valid hex in its description. */
  hex: string | null;
  locale: Locale;
}
