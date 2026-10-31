import React from "react";

interface infoProps {
  title: string;
  description: string;
}

/** One label/value pair inside a `<dl>`. */
const InfoCard = ({ description, title }: infoProps) => {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-sm text-garden-muted">{title}</dt>
      <dd className="font-semibold break-words"><bdi>{description}</bdi></dd>
    </div>
  );
};

export default InfoCard;
