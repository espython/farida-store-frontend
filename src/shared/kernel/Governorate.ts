/** Egypt's governorates with Woo's state codes (wc/v3/data/countries/eg). */
export const GOVERNORATES = [
  { code: "EGC", en: "Cairo", ar: "القاهرة" },
  { code: "EGGZ", en: "Giza", ar: "الجيزة" },
  { code: "EGALX", en: "Alexandria", ar: "الإسكندرية" },
  { code: "EGKB", en: "Qalyubia", ar: "القليوبية" },
  { code: "EGDK", en: "Dakahlia", ar: "الدقهلية" },
  { code: "EGSHR", en: "Al Sharqia", ar: "الشرقية" },
  { code: "EGGH", en: "Gharbia", ar: "الغربية" },
  { code: "EGMNF", en: "Monufia", ar: "المنوفية" },
  { code: "EGBH", en: "Beheira", ar: "البحيرة" },
  { code: "EGKFS", en: "Kafr el-Sheikh", ar: "كفر الشيخ" },
  { code: "EGDT", en: "Damietta", ar: "دمياط" },
  { code: "EGPTS", en: "Port Said", ar: "بورسعيد" },
  { code: "EGIS", en: "Ismailia", ar: "الإسماعيلية" },
  { code: "EGSUZ", en: "Suez", ar: "السويس" },
  { code: "EGFYM", en: "Faiyum", ar: "الفيوم" },
  { code: "EGBNS", en: "Beni Suef", ar: "بني سويف" },
  { code: "EGMN", en: "Minya", ar: "المنيا" },
  { code: "EGAST", en: "Asyut", ar: "أسيوط" },
  { code: "EGSHG", en: "Sohag", ar: "سوهاج" },
  { code: "EGKN", en: "Qena", ar: "قنا" },
  { code: "EGLX", en: "Luxor", ar: "الأقصر" },
  { code: "EGASN", en: "Aswan", ar: "أسوان" },
  { code: "EGBA", en: "Red Sea", ar: "البحر الأحمر" },
  { code: "EGWAD", en: "New Valley", ar: "الوادي الجديد" },
  { code: "EGMT", en: "Matrouh", ar: "مطروح" },
  { code: "EGSIN", en: "North Sinai", ar: "شمال سيناء" },
  { code: "EGJS", en: "South Sinai", ar: "جنوب سيناء" },
] as const;

export type GovernorateCode = (typeof GOVERNORATES)[number]["code"];

export const isGovernorate = (code: string): code is GovernorateCode => GOVERNORATES.some((g) => g.code === code);

export const governorateName = (code: string, locale: "en" | "ar"): string =>
  GOVERNORATES.find((g) => g.code === code)?.[locale] ?? code;
