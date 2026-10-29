import React, { useId } from "react";

interface formInputProps extends Partial<HTMLInputElement> {
  formHookRegister: any;

  label: string;
  labelPlacement?: "top" | "left";
  classNames?: {
    label?: string;
    inputContainer?: string;
  };
}

const CustomizedInput = ({
  formHookRegister,
  label,
  classNames,
  labelPlacement = "top",
  placeholder,
  required,
  type,
  inputMode,
}: formInputProps) => {
  const id = useId();
  return (
    <div className={labelPlacement === "left" ? "flex gap-3 items-center" : "flex flex-col gap-1.5"}>
      {label && (
        <label htmlFor={id} className={`text-sm font-semibold capitalize ${classNames?.label ?? ""}`}>
          {label}
          {required && (
            <span className="text-[#b42318] ps-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <input
        {...formHookRegister}
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        className={`h-12 w-full rounded-xl bg-white border border-line px-4 text-base text-garden placeholder:text-garden-muted outline-none transition-colors focus:border-garden focus:ring-2 focus:ring-garden/20 ${classNames?.inputContainer ?? ""}`}
      />
    </div>
  );
};

export default CustomizedInput;
