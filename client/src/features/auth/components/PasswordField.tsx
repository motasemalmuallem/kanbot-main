import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Tooltip } from "@shared/components/ui";
import { useLanguage } from "@shared/i18n/LanguageProvider";

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
};

const inputClasses =
  "min-h-[43px] w-full rounded-lg border border-kanbot-shell-control-border bg-kanbot-shell-control py-2 pl-10 pr-11 text-sm text-kanbot-ink shadow-none outline-none transition-colors hover:border-kanbot-accent/70 focus-visible:border-kanbot-accent focus-visible:ring-[3px] focus-visible:ring-kanbot-accent/20 aria-invalid:border-kanbot-danger-border-700 aria-invalid:focus-visible:ring-red-500/20";

export function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  registration,
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const { t, isArabic } = useLanguage();
  const errorId = `${id}-error`;

  return (
    <label
      className="grid gap-[7px] text-xs font-medium text-kanbot-muted"
      htmlFor={id}
    >
      <span>{label}</span>
      <span dir={isArabic ? "rtl" : "ltr"} className="relative block">
        <LockKeyhole
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kanbot-muted"
          size={16}
          aria-hidden="true"
        />
        <input
          {...registration}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={inputClasses}
        />
        <span className="absolute inset-y-0 right-[5px] grid w-9 place-items-center">
          <Tooltip content={t(visible ? "Hide password" : "Show password")}>
            <button
              className="grid size-9 place-items-center rounded-md border-0 bg-transparent p-0 text-kanbot-muted transition-colors hover:bg-kanbot-hover hover:text-kanbot-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-kanbot-accent"
              type="button"
              aria-label={t(visible ? "Hide password" : "Show password")}
              aria-pressed={visible}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </Tooltip>
        </span>
      </span>
      {error && (
        <small
          className="mt-0.5 text-[11px] leading-[1.4] text-kanbot-danger-300"
          id={errorId}
        >
          {error}
        </small>
      )}
    </label>
  );
}
