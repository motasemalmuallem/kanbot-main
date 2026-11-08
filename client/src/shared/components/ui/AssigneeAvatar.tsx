import { UserRound } from "lucide-react";
import { useLanguage } from "@shared/i18n/LanguageProvider";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

export function AssigneeAvatar({
  name,
  size = "sm",
}: {
  name: string | null;
  size?: "sm" | "md";
}) {
  const { t } = useLanguage();
  const sizeClasses = size === "md" ? "size-9 text-xs" : "size-7 text-[10px]";
  const accessibleName = name ? `${t("Assigned to")} ${name}` : t("Unassigned");
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full border border-kanbot-violet-border-300/30 bg-kanbot-violet-soft-15 font-semibold text-kanbot-violet-200 ${sizeClasses} ${name ? "" : "border-kanbot-zinc-border-700 bg-kanbot-zinc-800 text-kanbot-zinc-400"}`}
      title={accessibleName}
      aria-label={accessibleName}
    >
      {name ? (
        initialsFor(name)
      ) : (
        <UserRound size={size === "md" ? 15 : 13} aria-hidden="true" />
      )}
    </span>
  );
}
