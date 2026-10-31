import { useTranslations } from "next-intl";

const ITEMS = [
  { key: "shipping", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
  { key: "cod", icon: "M3 6h18v12H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { key: "returns", icon: "M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" },
  { key: "secure", icon: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" },
] as const;

/** Compact service promises for the product buy box (same copy as PerksStrip). */
const TrustList = () => {
  const t = useTranslations("perks");
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white rounded-2xl">
      {ITEMS.map((item) => (
        <li key={item.key} className="flex items-center gap-3 text-sm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="shrink-0">
            <path d={item.icon} />
          </svg>
          <span className="font-semibold">{t(`${item.key}.title`)}</span>
        </li>
      ))}
    </ul>
  );
};

export default TrustList;
