import type { ReactNode } from "react";

/** The 1280 px content column with 16 / 32 px side gutters. */
const PageContainer = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`max-w-[1280px] mx-auto px-4 md:px-8 ${className}`}>{children}</div>
);

export default PageContainer;
