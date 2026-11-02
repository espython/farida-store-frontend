import type { ReactNode } from "react";
import { Link } from "@/navigation";
import type { PromoLink as Target } from "../domain/Promotion";

/** Wraps a promotion in its link: a storefront path in the page's language, or an https address. */
const PromoLink = ({ link, className, children }: { link: Target | null; className?: string; children: ReactNode }) => {
  if (!link) return <div className={className}>{children}</div>;
  if (link.kind === "internal") {
    return (
      <Link href={link.href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
};

export default PromoLink;
