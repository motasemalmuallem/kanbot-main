import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-kanbot-accent/35 bg-kanbot-accent/10 text-kanbot-ink shadow-sm hover:border-kanbot-accent/55 hover:bg-kanbot-accent/15 hover:shadow-md",
  secondary:
    "border-kanbot-line-strong bg-kanbot-raised text-kanbot-ink hover:border-kanbot-accent/35 hover:bg-kanbot-hover",
  ghost:
    "border-transparent bg-transparent text-kanbot-muted hover:border-kanbot-line hover:bg-kanbot-hover hover:text-kanbot-ink",
  danger:
    "border-kanbot-danger-border-900/70 bg-kanbot-danger-soft-30 text-kanbot-danger-200 hover:border-kanbot-danger-border-900 hover:bg-kanbot-danger-soft-40",
};
const sizes = {
  sm: "min-h-9 rounded-lg px-3 text-xs",
  md: "min-h-10 rounded-lg px-4 text-sm",
  lg: "min-h-11 rounded-lg px-5 text-sm",
  icon: "size-9 rounded-lg p-0 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  type = "button",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-2 border font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kanbot-accent/45 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
