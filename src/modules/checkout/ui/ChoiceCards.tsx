"use client";
import type { ReactNode } from "react";

/** A labelled radio group drawn as cards (shipping rates, payment methods). */
const ChoiceCards = <T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  legend: string;
  name: string;
  value: T | null;
  options: { value: T; title: ReactNode; text?: ReactNode; icon?: ReactNode; aside?: ReactNode }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) => (
  <fieldset className="flex flex-col gap-3" disabled={disabled}>
    <legend className="font-display text-xl md:text-2xl mb-3">{legend}</legend>
    {options.map((o) => (
      <label
        key={o.value}
        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
          value === o.value ? "border-garden bg-cream" : "border-line hover:border-garden/40"
        }`}
      >
        <input
          type="radio"
          name={name}
          value={o.value}
          checked={value === o.value}
          onChange={() => onChange(o.value)}
          className="w-5 h-5 accent-[#1e3a2b]"
        />
        {o.icon && <span className="w-11 h-11 grid place-items-center rounded-full bg-sand text-xl" aria-hidden="true">{o.icon}</span>}
        <span className="flex flex-col flex-1 min-w-0">
          <span className="font-bold">{o.title}</span>
          {o.text && <span className="text-sm text-garden-muted">{o.text}</span>}
        </span>
        {o.aside && <span className="font-bold whitespace-nowrap">{o.aside}</span>}
      </label>
    ))}
  </fieldset>
);

export default ChoiceCards;
