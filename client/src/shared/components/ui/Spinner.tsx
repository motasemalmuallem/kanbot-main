import { LoaderCircle } from "lucide-react";
import { useLanguage } from "@shared/i18n/LanguageProvider";
export function Spinner({
  size = 20,
  label = "Loading",
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const localizedLabel = t(label);
  return (
    <span
      role="status"
      aria-label={localizedLabel}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <LoaderCircle size={size} className="animate-spin text-kanbot-accent" />
      <span className="sr-only">{localizedLabel}</span>
    </span>
  );
}
