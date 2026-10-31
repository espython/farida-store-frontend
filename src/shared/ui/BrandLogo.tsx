import { Link } from "@/navigation";

/** Word mark; Latin in both locales, set in the display face. */
const BrandLogo = ({ className = "" }: { className?: string }) => (
  <Link href="/" className={`font-display text-[1.75rem] leading-none font-bold text-garden ${className}`} dir="ltr">
    Farida
  </Link>
);

export default BrandLogo;
