import type { Locale } from "@/shared/kernel/Locale";

export interface Category {
  id: string;
  slug: string;
  title: string;
  parentId: string | null;
  productCount: number;
  image: { src: string; alt: string } | null;
  locale: Locale;
}
