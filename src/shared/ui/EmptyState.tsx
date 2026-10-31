import type { ReactNode } from "react";

/** Centred empty or error message on a white card: icon, title, one line, optional action. */
const EmptyState = ({
  icon,
  title,
  text,
  action,
  role,
}: {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  role?: "alert" | "status";
}) => (
  <div role={role} className="flex flex-col items-center text-center gap-3 px-6 py-12 md:py-16 bg-white rounded-3xl">
    {icon && <div className="w-16 h-16 grid place-items-center rounded-full bg-sand text-garden text-3xl">{icon}</div>}
    <p className="font-display text-xl md:text-2xl">{title}</p>
    {text && <p className="text-garden-muted max-w-md">{text}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
