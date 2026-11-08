import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { Tooltip } from "./ui/Tooltip";
import { useLanguage } from "@shared/i18n/LanguageProvider";
export function Modal({
  open,
  title,
  onClose,
  children,
  className = "",
  size = "default",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: "default" | "compact";
}) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLElement>(null);
  useDialogAccessibility(open, onClose, dialogRef);
  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 z-[60] grid place-items-center overflow-y-auto overflow-x-hidden bg-kanbot-overlay-70 p-4 backdrop-blur-sm motion-safe:animate-kanbot-fade-in motion-reduce:animate-none ${className}`.trim()}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={`my-auto max-h-[calc(100dvh-32px)] w-full ${size === "compact" ? "max-w-[720px]" : "max-w-[920px]"} min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-kanbot-line bg-kanbot-panel text-kanbot-ink shadow-2xl motion-safe:animate-kanbot-modal-enter motion-reduce:animate-none`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="sticky top-0 z-10 flex min-h-[58px] items-center justify-between gap-4 border-b border-kanbot-line bg-kanbot-panel px-5 py-3">
          <h2 className="m-0 text-base font-semibold text-kanbot-ink">{title}</h2>
          <Tooltip content={t("Close dialog")} placement="bottom"><button data-dialog-close className="grid size-9 place-items-center rounded-lg border border-kanbot-line bg-kanbot-raised p-0 text-kanbot-ink transition hover:bg-kanbot-hover" aria-label={t("Close dialog")} onClick={onClose}>
            <X size={17} aria-hidden="true" />
          </button></Tooltip>
        </header>
        {children}
      </section>
    </div>
  );
}
