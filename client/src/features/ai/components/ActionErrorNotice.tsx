import { useLanguage } from "@shared/i18n/LanguageProvider";
import { Button } from "@shared/components/ui";
import type { ActionError } from "../types/actionError";

export function ActionErrorNotice({ error }: { error: ActionError }) {
  const { t } = useLanguage();

  if (!error) return null;

  return (
    <div
      className="my-2 flex items-center justify-between gap-3 rounded-lg border border-kanbot-danger-border-900/70 bg-kanbot-danger-soft-30 px-3 py-2.5 text-xs text-kanbot-danger-200"
      role="alert"
    >
      <span>{error.message}</span>
      <Button variant="danger" size="sm" onClick={error.retry}>
        {t("Try again")}
      </Button>
    </div>
  );
}
