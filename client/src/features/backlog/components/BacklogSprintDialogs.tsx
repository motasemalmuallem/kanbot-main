import { useEffect, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { AlertTriangle, Play, Save, Trash2 } from "lucide-react";
import { Button, Dialog, Modal } from "@shared/components/ui";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import type { Sprint } from "@shared/types/api";
import { sprintFormSchema, type SprintFormValues } from "@features/sprints";

const fieldClass = "grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300";
const inputClass =
  "box-border min-h-10 w-full min-w-0 rounded-lg border border-kanbot-line-strong bg-kanbot-input-panel px-3 py-2 text-sm text-kanbot-ink focus:border-kanbot-accent focus:outline-none focus:ring-2 focus:ring-kanbot-accent/20";
const actionsClass = "mt-2 flex flex-wrap justify-end gap-2";
const errorClass =
  "rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2.5 text-sm text-kanbot-danger-200";

type BacklogSprintDialogsProps = {
  sprintFormOpen: boolean;
  editingSprint: Sprint | null;
  sprintStartDate: string;
  onSprintStartDateChange: (value: string) => void;
  sprintEndDate: string;
  onSprintEndDateChange: (value: string) => void;
  sprintError: string;
  onSaveSprint: (values: SprintFormValues) => void;
  onCloseSprintForm: () => void;
  startingSprint: Sprint | null;
  onConfirmStartSprint: (event: FormEvent<HTMLFormElement>) => void;
  onCloseStartSprint: () => void;
  deletingSprint: Sprint | null;
  onConfirmDeleteSprint: () => void;
  onCloseDeleteSprint: () => void;
};

export function BacklogSprintDialogs({
  sprintFormOpen,
  editingSprint,
  sprintStartDate,
  onSprintStartDateChange,
  sprintEndDate,
  onSprintEndDateChange,
  sprintError,
  onSaveSprint,
  onCloseSprintForm,
  startingSprint,
  onConfirmStartSprint,
  onCloseStartSprint,
  deletingSprint,
  onConfirmDeleteSprint,
  onCloseDeleteSprint,
}: BacklogSprintDialogsProps) {
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: { name: "", goal: "", startDate: "", endDate: "" },
  });
  const sprintFormStartDate = useWatch({ control, name: "startDate" }) ?? "";

  useEffect(() => {
    if (!sprintFormOpen) return;
    reset({
      name: editingSprint?.name ?? "",
      goal: editingSprint?.goal ?? "",
      startDate: editingSprint?.startDate ?? "",
      endDate: editingSprint?.endDate ?? "",
    });
  }, [editingSprint, reset, sprintFormOpen]);

  return (
    <>
      <Modal
        open={sprintFormOpen}
        title={editingSprint ? t("Edit sprint") : t("Create sprint")}
        onClose={onCloseSprintForm}
        size="compact"
      >
        <form
          className="grid w-full min-w-0 gap-4 p-5 text-sm text-kanbot-zinc-200"
          onSubmit={handleSubmit(onSaveSprint)}
          noValidate
        >
          <label className={fieldClass}>
            {t("Sprint name")}
            <input
              className={inputClass}
              placeholder={t("Sprint name")}
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name?.message && <small className="text-kanbot-danger-200" role="alert">{t(errors.name.message)}</small>}
          </label>
          <label className={fieldClass}>
            {t("Goal")}
            <input
              className={inputClass}
              placeholder={t("What should this sprint achieve?")}
              maxLength={300}
              {...register("goal")}
            />
          </label>
          <div className="grid w-full min-w-0 grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <label className={fieldClass}>
              {t("Start date")}
              <input
                className={inputClass}
                type="date"
                {...register("startDate")}
              />
            </label>
            <label className={fieldClass}>
              {t("End date")}
              <input
                className={inputClass}
                type="date"
                min={sprintFormStartDate || undefined}
                aria-invalid={Boolean(errors.endDate)}
                {...register("endDate")}
              />
              {errors.endDate?.message && <small className="text-kanbot-danger-200" role="alert">{t(errors.endDate.message)}</small>}
            </label>
          </div>
          {sprintError && (
            <p className={errorClass} role="alert">
              {sprintError}
            </p>
          )}
          <div className={actionsClass}>
            <Button
              variant="primary"
              size="md"
              type="submit"
              icon={<Save size={15} aria-hidden="true" />}
            >
              {editingSprint ? t("Save changes") : t("Create sprint")}
            </Button>
            <Button variant="secondary" size="md" onClick={onCloseSprintForm}>
              {t("Cancel")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!startingSprint}
        title={`${t("Start sprint")}${startingSprint?.name ? ` · ${startingSprint.name}` : ""}`}
        onClose={onCloseStartSprint}
        size="compact"
      >
        <form
          className="grid w-full min-w-0 gap-4 p-5 text-sm text-kanbot-zinc-200"
          onSubmit={onConfirmStartSprint}
        >
          <p className="text-sm leading-relaxed text-kanbot-muted">
            {t("Confirm the dates for this sprint. Tasks in the sprint will be available on the Board.")}
          </p>
          <div className="grid w-full min-w-0 grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <label className={fieldClass}>
              {t("Start date")}
              <input
                required
                className={inputClass}
                type="date"
                value={sprintStartDate}
                onChange={(event) => onSprintStartDateChange(event.target.value)}
              />
            </label>
            <label className={fieldClass}>
              {t("End date")}
              <input
                required
                className={inputClass}
                type="date"
                min={sprintStartDate || undefined}
                value={sprintEndDate}
                onChange={(event) => onSprintEndDateChange(event.target.value)}
              />
            </label>
          </div>
          {sprintError && (
            <p className={errorClass} role="alert">
              {sprintError}
            </p>
          )}
          <div className={actionsClass}>
            <Button
              variant="primary"
              size="md"
              type="submit"
              icon={<Play size={14} fill="currentColor" aria-hidden="true" />}
            >
              {t("Start sprint")}
            </Button>
            <Button variant="secondary" size="md" onClick={onCloseStartSprint}>
              {t("Cancel")}
            </Button>
          </div>
        </form>
      </Modal>

      <Dialog
        open={!!deletingSprint}
        title={t("Delete sprint?")}
        onClose={onCloseDeleteSprint}
        footer={
          <>
            <Button
              variant="danger"
              size="md"
              onClick={onConfirmDeleteSprint}
              icon={<Trash2 size={14} aria-hidden="true" />}
            >
              {t("Delete sprint")}
            </Button>
            <Button variant="secondary" size="md" onClick={onCloseDeleteSprint}>
              {t("Cancel")}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 text-sm text-kanbot-zinc-300">
          <div className="flex items-start gap-3 rounded-lg border border-kanbot-line bg-kanbot-raised p-3.5">
            <span className="mt-0.5 shrink-0 text-kanbot-warning-300" aria-hidden="true">
              <AlertTriangle size={17} />
            </span>
            <p className="leading-relaxed">
              {t("This planned sprint will be deleted. Its tasks will return to the backlog.")}
            </p>
          </div>
          {sprintError && (
            <p className={errorClass} role="alert">
              {sprintError}
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
