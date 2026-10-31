import React from "react";

interface infoCardProps {
  title?: string;
  description?: string;
}

/** One label/value pair inside a `<dl>`. */
const UserInfoCard = ({ title, description }: infoCardProps) => {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-sm text-garden-muted first-letter:uppercase">{title}</dt>
      <dd className="font-semibold break-words"><bdi>{description || "—"}</bdi></dd>
    </div>
  );
};

export default UserInfoCard;
