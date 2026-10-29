import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-garden text-cream hover:bg-garden-600",
  accent: "bg-saffron text-garden hover:brightness-95",
  outline: "border-2 border-garden text-garden hover:bg-garden hover:text-cream",
  ghost: "text-garden hover:bg-sand",
  danger: "bg-[#b42318] text-white hover:bg-[#912018]",
};

const SIZES: Record<ButtonSize, string> = {
  md: "h-11 px-6 text-base",
  lg: "h-12 px-7 text-[1.0625rem]",
};

/** Kitchen Garden button classes, also for links that look like buttons. Always ≥ 44 px tall. */
export const buttonClass = ({
  variant = "primary",
  size = "md",
  full = false,
}: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean } = {}) =>
  `inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-garden ${VARIANTS[variant]} ${SIZES[size]} ${full ? "w-full" : ""}`;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant, size, full, className = "", type = "button", ...rest }, ref) => (
    <button ref={ref} type={type} className={`${buttonClass({ variant, size, full })} ${className}`} {...rest} />
  )
);
Button.displayName = "Button";

export default Button;
