import type { TodoPriority } from "@shared/types/api";
import { useLanguage } from "@shared/i18n/LanguageProvider";

const labels: Record<TodoPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const colors: Record<TodoPriority, string> = {
  low: "border-kanbot-zinc-border-700 bg-kanbot-zinc-800/70 text-kanbot-zinc-300",
  medium: "border-kanbot-warning-border-800/70 bg-kanbot-warning-soft-40 text-kanbot-warning-300",
  high: "border-kanbot-danger-border-900/80 bg-kanbot-danger-soft-40 text-kanbot-danger-300",
  urgent: "border-kanbot-rose-border-800 bg-kanbot-rose-soft-50 text-kanbot-rose-200",
};

export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const { t } = useLanguage();
  return (
    <span className={`inline-flex min-h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-medium ${colors[priority]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(labels[priority])}
    </span>
  );
}
