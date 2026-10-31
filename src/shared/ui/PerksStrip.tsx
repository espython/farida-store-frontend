import { useTranslations } from "next-intl";

const PERKS = [
  { key: "shipping", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
  { key: "cod", icon: "M3 6h18v12H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { key: "returns", icon: "M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" },
  { key: "secure", icon: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" },
] as const;

/** Why-shop-with-us strip: four service promises, shown above the footer. */
const PerksStrip = () => {
  const t = useTranslations("perks");

  return (
    <section
      aria-label={t("label")}
      className="grid gap-6 p-6 md:p-8 bg-white rounded-3xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    >
      {PERKS.map((p) => (
        <div key={p.key} className="flex gap-4 lg:flex-col lg:gap-2">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="shrink-0">
            <path d={p.icon} />
          </svg>
          <div>
            <p className="font-display text-lg">{t(`${p.key}.title`)}</p>
            <p className="text-sm text-garden-muted">{t(`${p.key}.text`)}</p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default PerksStrip;
