import { useEffect, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";
import { useLanguage } from "@shared/i18n/LanguageProvider";

export type ToastVariant = "success" | "error" | "info";
const icon = { success: CheckCircle2, error: AlertCircle, info: Info };
const color = {
  success: {
    shell: "border-kanbot-success-border-900 bg-kanbot-success-soft-70 text-kanbot-success-100",
    icon: "text-kanbot-success-300",
    message: "text-kanbot-success-200",
  },
  error: {
    shell: "border-kanbot-danger-border-900 bg-kanbot-danger-soft-70 text-kanbot-danger-100",
    icon: "text-kanbot-danger-300",
    message: "text-kanbot-danger-200",
  },
  info: {
    shell: "border-kanbot-line-strong bg-kanbot-raised text-kanbot-ink",
    icon: "text-kanbot-accent",
    message: "text-kanbot-muted",
  },
};
export function Toast({
  title,
  message,
  variant = "info",
  onClose,
  action,
}: {
  title: string;
  message?: string;
  variant?: ToastVariant;
  onClose?: () => void;
  action?: ReactNode;
}) {
  const { t } = useLanguage();
  const Icon = icon[variant];
  const colors = color[variant];
  useEffect(() => {
    if (!onClose) return;
    const id = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(id);
  }, [onClose]);
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg motion-safe:animate-kanbot-toast-enter motion-reduce:animate-none ${colors.shell}`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${colors.icon}`} />
      <div className="min-w-0 flex-1">
        <strong className="text-sm font-semibold">{t(title)}</strong>
        {message && (
          <p className={`mt-1 text-sm ${colors.message}`}>{t(message)}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onClose && (
        <Tooltip content={t("Dismiss notification")}>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("Dismiss notification")}
            onClick={onClose}
            icon={<X size={15} />}
          />
        </Tooltip>
      )}
    </div>
  );
}
