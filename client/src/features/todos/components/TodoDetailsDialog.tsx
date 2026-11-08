import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useTodoMutations } from "../hooks/useTodos";
import {
  AssigneeAvatar,
  Button,
  Modal,
  PointsSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui";
import type {
  Sprint,
  Todo,
  TodoPriority,
  TodoStatus,
  TodoType,
} from "@shared/types/api";
import { PriorityBadge } from "@shared/components/ui";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import { todoFormSchema, type TodoFormValues } from "../types/todoForm";

type TodoDetailsDialogProps = {
  todo: Todo;
  sprints: Sprint[];
  onClose: () => void;
  onChanged: () => Promise<void>;
};

const typeLabels: Record<TodoType, string> = {
  task: "Task",
  story: "Story",
  bug: "Bug",
};
const priorityLabels: Record<TodoPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function TodoDetailsDialog({
  todo,
  sprints,
  onClose,
  onChanged,
}: TodoDetailsDialogProps) {
  const { t } = useLanguage();
  const mutations = useTodoMutations(todo.projectId);
  const saving = mutations.update.isPending;
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, control, formState: { errors } } = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: todo.title,
      description: todo.description,
      assigneeName: todo.assigneeName ?? "",
      type: todo.type,
      priority: todo.priority,
      status: todo.status,
      storyPoints: todo.storyPoints,
      sprintId: todo.sprintId ?? "",
    },
  });
  const assigneeName = useWatch({ control, name: "assigneeName" }) ?? "";
  const todoPriority = useWatch({ control, name: "priority" });
  const currentSprint = sprints.find((sprint) => sprint.id === todo.sprintId);
  const lockedInCompletedSprint = currentSprint?.status === "completed";

  const save = async (values: TodoFormValues) => {
    setError("");
    try {
      await mutations.update.mutateAsync({ id: todo.id, body: {
        title: values.title,
        assigneeName: values.assigneeName.trim() || null,
        description: values.description,
        type: values.type,
        priority: values.priority,
        status: values.status,
        storyPoints: values.storyPoints,
        sprintId: values.sprintId || null,
      } });
      await onChanged();
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Couldn't save this task.",
      );
    }
  };

  const remove = async () => {
    setDeleting(true);
    setError("");
    try {
      await mutations.delete.mutateAsync(todo.id);
      await onChanged();
      setConfirmDelete(false);
      onClose();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Couldn't delete this task.",
      );
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal open title={todo.key} onClose={onClose}>
        <form className="grid w-full min-w-0 grid-cols-[minmax(0,1.2fr)_minmax(250px,.9fr)] gap-x-7 gap-y-4 p-5 max-md:grid-cols-1" onSubmit={handleSubmit(save)} noValidate>
          <div className="grid min-w-0 content-start gap-4">
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">
              <span>{t("Title")}</span>
              <input
                className="min-h-10 w-full min-w-0 rounded-lg border border-kanbot-line-strong bg-kanbot-input-panel px-3 py-2 text-sm text-kanbot-ink focus:border-kanbot-accent focus:outline-none focus:ring-2 focus:ring-kanbot-accent/20"
                maxLength={200}
                {...register("title")}
              />
              {errors.title?.message && <small className="text-kanbot-danger-200" role="alert">{t(errors.title.message)}</small>}
            </label>
            <label className="grid min-w-0 gap-1.5">
              <span className="text-sm font-medium text-kanbot-zinc-200">
                {t("Assignee")}
              </span>
              <span className="flex items-center gap-3">
                <AssigneeAvatar name={assigneeName.trim() || null} size="md" />
                <input
                  className="min-w-0 flex-1 rounded-md border border-kanbot-zinc-border-700 bg-kanbot-zinc-900 px-3 py-2 text-sm text-kanbot-zinc-100 outline-none placeholder:text-kanbot-zinc-500 focus:border-kanbot-violet-border-400 focus:ring-2 focus:ring-violet-400/20"
                  maxLength={80}
                  {...register("assigneeName")}
                  placeholder={t("Enter a teammate's name")}
                />
              </span>
              <small className="text-xs text-kanbot-zinc-500">
                {t("The avatar updates with the person's initials.")}
              </small>
            </label>
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">
              <span>{t("Description")}</span>
              <textarea
                className="h-[164px] min-h-[164px] w-full resize-none rounded-lg border border-kanbot-line-strong bg-kanbot-input-panel px-3 py-2 text-sm leading-relaxed text-kanbot-ink focus:border-kanbot-accent focus:outline-none focus:ring-2 focus:ring-kanbot-accent/20"
                maxLength={5000}
                {...register("description")}
              />
            </label>
            <div className="flex items-center gap-3 text-xs text-kanbot-muted">
              <span>{t("Priority")}</span>
              <PriorityBadge priority={todoPriority} />
            </div>
          </div>
          <div className="grid min-w-0 content-start gap-3.5">
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">
              {t("Status")}
              <Controller control={control} name="status" render={({ field }) => <Select value={field.value} disabled={lockedInCompletedSprint} onValueChange={(value) => { if (typeof value === "string") field.onChange(value as TodoStatus); }}>
                <SelectTrigger aria-label={t("Status")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">{t("To Do")}</SelectItem>
                  <SelectItem value="in_progress">{t("In Progress")}</SelectItem>
                  <SelectItem value="in_review">{t("In Review")}</SelectItem>
                  <SelectItem value="done">{t("Done")}</SelectItem>
                </SelectContent>
              </Select>} />
            </label>
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">
              {t("Priority")}
              <Controller control={control} name="priority" render={({ field }) => <Select value={field.value} onValueChange={(value) => { if (typeof value === "string") field.onChange(value as TodoPriority); }}>
                <SelectTrigger aria-label={t("Priority")}><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(priorityLabels).map(([value, label]) => <SelectItem key={value} value={value}>{t(label)}</SelectItem>)}</SelectContent>
              </Select>} />
            </label>
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">
              {t("Type")}
              <Controller control={control} name="type" render={({ field }) => <Select value={field.value} onValueChange={(value) => { if (typeof value === "string") field.onChange(value as TodoType); }}>
                <SelectTrigger aria-label={t("Type")}><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(typeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{t(label)}</SelectItem>)}</SelectContent>
              </Select>} />
            </label>
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">
              {t("Story points")}
              <Controller control={control} name="storyPoints" render={({ field }) => <PointsSelect value={field.value} onChange={field.onChange} />} />
            </label>
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">
              {t("Sprints")}
              <Controller control={control} name="sprintId" render={({ field }) => <Select value={field.value || null} disabled={lockedInCompletedSprint} onValueChange={(value) => field.onChange(typeof value === "string" ? value : "")}>
                <SelectTrigger aria-label={t("Sprints")}><SelectValue placeholder={t("Backlog")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>{t("Backlog")}</SelectItem>
                  {sprints.map((sprint) => <SelectItem key={sprint.id} value={sprint.id} disabled={sprint.status === "completed"}>{sprint.name} · {t(sprint.status)}</SelectItem>)}
                </SelectContent>
              </Select>} />
              {lockedInCompletedSprint && (
                <small className="text-[11px] font-normal text-kanbot-muted">{t("Completed sprint tasks are kept in history.")}</small>
              )}
            </label>
          </div>
          {error && (
            <p className="col-span-full rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2.5 text-sm text-kanbot-danger-200" role="alert">
              {error}
            </p>
          )}
          <footer className="col-span-full flex items-center gap-2 border-t border-kanbot-line pt-4 max-sm:flex-wrap">
            <Button
              type="button"
              variant="danger"
              className="me-auto"
              onClick={() => {
                setError("");
                setConfirmDelete(true);
              }}
              disabled={saving || mutations.delete.isPending}
            >
              {t("Delete task")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              loading={saving}
              icon={<Save size={15} aria-hidden="true" />}
              className="!border-kanbot-accent !bg-kanbot-accent !text-kanbot-accent-contrast !shadow-md hover:!bg-kanbot-accent/90 hover:!shadow-lg focus-visible:!ring-kanbot-accent/60"
            >
              {saving ? t("Saving…") : t("Save")}
            </Button>
          </footer>
        </form>
      </Modal>

      <Modal
        open={confirmDelete}
        title={t("Delete task?")}
        onClose={() => {
          if (!deleting) setConfirmDelete(false);
        }}
      >
        <div className="grid gap-4 p-5 text-sm leading-relaxed text-kanbot-zinc-300">
          <p className="m-0">
            {t("Delete ")}{" "}
            <strong>
              {todo.key} · {todo.title}
            </strong>
            ? {t("This can't be undone.")}
          </p>
          {error && (
            <p className="rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2.5 text-sm text-kanbot-danger-200" role="alert">
              {error}
            </p>
          )}
          <footer className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={() => void remove()}
            >
              {t("Delete task")}
            </Button>
          </footer>
        </div>
      </Modal>
    </>
  );
}
