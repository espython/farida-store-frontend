import React from "react";

interface addressCell {
  title: string;
  description: string;
}

/** One label/value pair inside a `<dl>`. */
const AddressCell = ({ title, description }: addressCell) => {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-sm text-garden-muted first-letter:uppercase">{title}</dt>
      <dd className="font-semibold break-words">{description}</dd>
    </div>
  );
};

export default AddressCell;
