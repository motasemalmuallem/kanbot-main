import { forwardRef, type InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className = "", ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="grid gap-1.5">
      {label && (
        <label className="text-sm font-medium text-kanbot-zinc-200" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={`min-h-10 w-full rounded-lg border bg-kanbot-input-panel px-3 text-sm text-kanbot-ink outline-none placeholder:text-kanbot-subtle focus:border-kanbot-accent focus:ring-2 focus:ring-kanbot-accent/20 disabled:opacity-50 ${error ? "border-kanbot-danger-border-700" : "border-kanbot-line-strong"} ${className}`}
        {...props}
      />
      {error ? (
        <span
          id={`${inputId}-error`}
          className="flex items-center gap-1 text-xs text-kanbot-danger-300"
        >
          <AlertCircle size={13} />
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-xs text-kanbot-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
