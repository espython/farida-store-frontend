import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type Common = { label: string; error?: string; hint?: string };
type InputProps = Common & InputHTMLAttributes<HTMLInputElement> & { multiline?: false };
type AreaProps = Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true };

const fieldClass = (invalid: boolean) =>
  `w-full rounded-xl bg-white border px-4 text-base text-garden placeholder:text-garden-muted outline-none transition-colors focus:border-garden focus:ring-2 focus:ring-garden/20 ${
    invalid ? "border-[#b42318]" : "border-line"
  }`;

/** Labelled input (or textarea) with hint and error text; works with react-hook-form's register(). */
const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps | AreaProps>((props, ref) => {
  const autoId = useId();
  const { label, error, hint, className = "", id = autoId, multiline, ...rest } = props;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${fieldClass(!!error)} py-3 min-h-[8rem]`}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${fieldClass(!!error)} h-12`}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-[#b42318]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-garden-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
});
TextField.displayName = "TextField";

export default TextField;
