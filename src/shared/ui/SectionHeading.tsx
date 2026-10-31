import type { ReactNode } from "react";

/** Section title in the display face, with an optional trailing action (a "See all" link). */
const SectionHeading = ({
  children,
  action,
  as: Tag = "h2",
  className = "",
}: {
  children: ReactNode;
  action?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) => (
  <div className={`flex items-baseline justify-between gap-4 flex-wrap ${className}`}>
    <Tag className="font-display text-2xl md:text-[2rem] leading-tight font-medium">{children}</Tag>
    {action}
  </div>
);

export default SectionHeading;
