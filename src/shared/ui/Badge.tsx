import type { ReactNode } from "react";

type Tone = "sale" | "dark" | "muted" | "success" | "warning";

const TONES: Record<Tone, string> = {
  sale: "bg-saffron text-garden",
  dark: "bg-garden text-cream",
  muted: "bg-sand text-garden",
  success: "bg-[#dcebe0] text-garden",
  warning: "bg-[#fbe9c4] text-saffron-ink",
};

/** Small rounded label: discount, stock, order status. */
const Badge = ({ tone = "muted", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[0.8125rem] font-bold ${TONES[tone]} ${className}`}>
    {children}
  </span>
);

export default Badge;
