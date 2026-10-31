"use client";
import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { LuEye, LuEyeOff } from "react-icons/lu";
import TextField from "@/shared/ui/TextField";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

/** Password input with a show/hide toggle button. */
const PasswordField = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      ref={ref}
      {...props}
      type={visible ? "text" : "password"}
      end={
        <button
          type="button"
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="w-11 h-11 grid place-items-center rounded-lg text-garden-muted hover:text-garden focus-visible:outline focus-visible:outline-2 focus-visible:outline-garden"
        >
          {visible ? <LuEyeOff aria-hidden="true" /> : <LuEye aria-hidden="true" />}
        </button>
      }
    />
  );
});
PasswordField.displayName = "PasswordField";

export default PasswordField;
