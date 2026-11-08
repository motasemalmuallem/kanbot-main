import { AlertTriangle } from "lucide-react";
import { Button, Dialog } from "@shared/components/ui";
import type { ProjectWithStats } from "@shared/types/api";
import { useLanguage } from "@shared/i18n/LanguageProvider";

type DeleteProjectDialogProps = {
  project: ProjectWithStats;
  deleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteProjectDialog({
  project,
  deleting,
  error,
  onClose,
  onConfirm,
}: DeleteProjectDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog
      open
      title={t("Delete project?")}
      description={t("This action cannot be undone.")}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={deleting}>
            {t("Cancel")}
          </Button>
          <Button type="button" variant="danger" loading={deleting} onClick={onConfirm}>
            {t("Delete project")}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 text-sm text-kanbot-zinc-300">
        <span className="mt-0.5 text-kanbot-warning-300" aria-hidden="true"><AlertTriangle size={19} /></span>
        <p>
          {t("Delete project")} <strong>{project.name}</strong>? {t("Its tasks and sprints will also be permanently deleted.")}
        </p>
      </div>
      {error && <p className="mt-4 rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2 text-sm text-kanbot-danger-200" role="alert">{error}</p>}
    </Dialog>
  );
}
