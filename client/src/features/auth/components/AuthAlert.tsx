import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";

type AuthAlertProps = {
  children: ReactNode;
  variant?: "error" | "warning";
};

export function AuthAlert({ children, variant = "error" }: AuthAlertProps) {
  const isWarning = variant === "warning";
  const Icon = isWarning ? AlertTriangle : AlertCircle;
  const tone = isWarning
    ? "border-kanbot-warning-border-900/70 bg-kanbot-warning-soft-50 text-kanbot-warning-200"
    : "border-kanbot-danger-border-900/70 bg-kanbot-danger-soft-50 text-kanbot-danger-200";
  const iconTone = isWarning ? "text-kanbot-warning-400" : "text-kanbot-danger-400";

  return (
    <div
      className={`mb-4 flex items-start gap-2.5 rounded-lg border px-3 py-3 text-xs font-medium leading-relaxed ${tone}`}
      role={isWarning ? "status" : "alert"}
    >
      <Icon
        size={18}
        className={`mt-px shrink-0 ${iconTone}`}
        aria-hidden="true"
      />
      <div>{children}</div>
    </div>
  );
}
