import React from "react";

interface orderCardInfoProps {
  title?: string;
  description?: string;
}

/** One label/value pair inside a `<dl>`. */
const OrderCardInfo = ({ title, description }: orderCardInfoProps) => {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-sm text-garden-muted">{title}</dt>
      <dd className="font-semibold">{description}</dd>
    </div>
  );
};

export default OrderCardInfo;
