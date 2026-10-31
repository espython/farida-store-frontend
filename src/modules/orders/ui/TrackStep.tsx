import type { ReactNode } from "react";
import { LuCheck } from "react-icons/lu";
import type { StepState } from "../domain/Order";

/** One step of the vertical order timeline: marker, connecting line, title, body. */
const TrackStep = ({
  index,
  state,
  title,
  stateLabel,
  last = false,
  children,
}: {
  index: number;
  state: StepState;
  title: string;
  stateLabel: string;
  last?: boolean;
  children?: ReactNode;
}) => (
  <li className="grid grid-cols-[2.75rem_1fr] gap-x-4" aria-current={state === "current" ? "step" : undefined}>
    <div className="flex flex-col items-center">
      <span
        aria-hidden="true"
        className={`w-11 h-11 shrink-0 grid place-items-center rounded-full font-bold ${
          state === "done"
            ? "bg-garden text-cream"
            : state === "current"
            ? "bg-saffron text-garden"
            : "bg-white border-2 border-line text-garden-muted"
        }`}
      >
        {state === "done" ? <LuCheck /> : index}
      </span>
      {!last && <span aria-hidden="true" className={`w-0.5 flex-1 min-h-[1.5rem] my-1 ${state === "done" ? "bg-garden" : "bg-line"}`} />}
    </div>
    <div className={`flex flex-col gap-2 ${last ? "" : "pb-8"} ${state === "upcoming" ? "text-garden-muted" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-h-[2.75rem]">
        <h3 className="font-display text-lg md:text-xl text-garden">{title}</h3>
        <span className="text-sm">{stateLabel}</span>
      </div>
      {children}
    </div>
  </li>
);

export default TrackStep;
