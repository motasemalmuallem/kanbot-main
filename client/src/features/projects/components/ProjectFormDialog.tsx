import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Save } from "lucide-react";
import { Button, Dialog, Input } from "@shared/components/ui";
import type { ProjectWithStats } from "@shared/types/api";
import { projectSchema, type ProjectFormValues } from "../types/project";
import { useLanguage } from "@shared/i18n/LanguageProvider";

const formId = "project-editor-form";

type ProjectFormDialogProps = {
  project: ProjectWithStats | null;
  values: ProjectFormValues;
  fieldErrors: Partial<Record<keyof ProjectFormValues, string>>;
  formError: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
};

export function ProjectFormDialog({
  project,
  values,
  fieldErrors,
  formError,
  saving,
  onClose,
  onSubmit,
}: ProjectFormDialogProps) {
  const { t, formatNumber } = useLanguage();
  const editing = Boolean(project);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: values,
  });
  const description = useWatch({ control, name: "description" }) ?? values.description;

  useEffect(() => reset(values), [reset, values]);

  return (
    <Dialog
      open
      title={editing ? t("Edit project") : t("Create project")}
      description={
        editing
          ? t("Update the project name, key, or description.")
          : t("Set up a project to organize its backlog and sprints.")
      }
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={saving}>
            {t("Cancel")}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="md"
            icon={<Save size={15} aria-hidden="true" />}
            loading={saving}
          >
            {editing ? t("Save changes") : t("Create project")}
          </Button>
        </>
      }
    >
      <form id={formId} className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <p className="rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2 text-sm text-kanbot-danger-200" role="alert">
            {formError}
          </p>
        )}
        <Input
          id="project-name"
          label={t("Project name")}
          autoFocus
          autoComplete="off"
          maxLength={80}
          required
          {...register("name")}
          error={errors.name?.message ?? fieldErrors.name}
          placeholder={t("e.g. Kanbot App")}
        />
        <Input
          id="project-key"
          label={t("Project key")}
          hint={t(editing ? "2–6 letters. Existing task keys keep their current prefix." : "Optional. Leave blank to generate a key from the project name.")}
          maxLength={6}
          required={editing}
          {...register("key", { onChange: (event) => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z]/g, ""); } })}
          error={errors.key?.message ?? fieldErrors.key}
          placeholder={editing ? "KAN" : t("Auto-generated")}
          aria-invalid={Boolean(fieldErrors.key)}
        />
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-kanbot-zinc-200" htmlFor="project-description">
            {t("Description")} <span className="font-normal text-kanbot-muted">({t("optional")})</span>
          </label>
          <textarea
            id="project-description"
            className="h-[132px] min-h-[132px] w-full resize-none rounded-lg border border-kanbot-line-strong bg-kanbot-input-panel px-3 py-2 text-sm text-kanbot-ink outline-none placeholder:text-kanbot-subtle focus:border-kanbot-accent focus:ring-2 focus:ring-kanbot-accent/20"
            maxLength={500}
            {...register("description")}
            placeholder={t("What is this project about?")}
          />
          <span className="text-end text-xs text-kanbot-muted">{formatNumber(description.length)}/500</span>
        </div>
      </form>
    </Dialog>
  );
}
