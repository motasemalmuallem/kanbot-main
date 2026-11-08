import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarPlus, Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { useParams, useSearchParams } from "react-router";
import { useSprintMutations, useSprints } from "../hooks/useSprints";
import { useAiActions } from "@features/ai/hooks/useAi";
import { MarkdownContent } from "@shared/components";
import { Button, Modal, Spinner, Toast } from "@shared/components/ui";
import type { Sprint, UpdateSprintRequest } from "@shared/types/api";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import { sprintFormSchema, type SprintFormValues } from "../types/sprintForm";

const sprintStatusTone: Record<Sprint["status"], string> = {
  planned: "border-kanbot-warning-border-800/70 bg-kanbot-warning-soft-40 text-kanbot-warning-300",
  active: "border-kanbot-indigo-border-800/70 bg-kanbot-indigo-soft-40 text-kanbot-indigo-300",
  completed: "border-kanbot-success-border-800/70 bg-kanbot-success-soft-40 text-kanbot-success-300",
};
const sprintStatusClass = (status: Sprint["status"]) => `inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${sprintStatusTone[status]}`;
const formErrorClass = "rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2.5 text-sm text-kanbot-danger-200";
export function SprintsPage() {
  const { t, isArabic, formatDate, formatNumber } = useLanguage();
  const { projectId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const sprintsQuery = useSprints(projectId);
  const sprintMutations = useSprintMutations(projectId);
  const aiActions = useAiActions(projectId);
  const sprints = sprintsQuery.data?.sprints ?? [];
  const selected = sprints.find((sprint) => sprint.id === params.get("selected")) ?? sprints[0] ?? null;
  const loadError = sprintsQuery.error ? sprintsQuery.error instanceof Error ? sprintsQuery.error.message : "Couldn't load sprints." : "";
  const summaryLoading = aiActions.summarizeSprint.isPending;
  const [summaryError, setSummaryError] = useState("");
  const [sprintForm, setSprintForm] = useState(false);
  const [editing, setEditing] = useState<Sprint | null>(null);
  const [deleting, setDeleting] = useState<Sprint | null>(null);
  const deleteLoading = sprintMutations.delete.isPending;
  const [toast, setToast] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);
  const [formError, setFormError] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: { name: "", goal: "", startDate: "", endDate: "" },
  });
  const selectedStats = selected?.completedStats ?? selected?.stats;
  const loading = sprintsQuery.isPending || sprintsQuery.isFetching;
  const refresh = () => sprintsQuery.refetch();
  const pick = (s: Sprint) => {
    setParams({ selected: s.id });
  };
  const generateSummary = async () => {
    if (!selected || summaryLoading) return;
    setSummaryError("");
    try {
      await aiActions.summarizeSprint.mutateAsync(selected.id);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Couldn't create the sprint summary.");
    }
  };
  const openSprintForm = (sprint: Sprint | null = null) => {
    setEditing(sprint);
    reset({
      name: sprint?.name ?? "",
      goal: sprint?.goal ?? "",
      startDate: sprint?.startDate ?? "",
      endDate: sprint?.endDate ?? "",
    });
    setFormError("");
    setSprintForm(true);
  };
  const saveSprint = async (values: SprintFormValues) => {
    setFormError("");
    const body: UpdateSprintRequest = { name: values.name, goal: values.goal.trim(), startDate: values.startDate || null, endDate: values.endDate || null };
    try {
      if (editing) await sprintMutations.update.mutateAsync({ id: editing.id, body });
      else await sprintMutations.create.mutateAsync(body);
      setSprintForm(false);
      setToast({ title: editing ? "Sprint updated" : "Sprint created", message: `${body.name || "Sprint"} was saved.`, variant: "success" });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Couldn't save the sprint.");
    }
  };
  return (
    <>
      <header dir={isArabic ? "rtl" : "ltr"} className="flex min-h-[76px] items-center justify-between gap-3 border-b border-kanbot-line bg-transparent px-page py-4 max-md:min-h-[66px] max-md:px-4">
        <h1 className="m-0 text-xl font-semibold tracking-tight text-kanbot-ink max-md:text-lg">
          {t("Sprints")} <small className="ms-3 text-xs font-normal text-kanbot-muted">{formatNumber(sprints.length)} {t("sprints")}</small>
        </h1>
      </header>
      <div dir={isArabic ? "rtl" : "ltr"} className="grid min-h-[calc(100vh-168px)] grid-cols-[minmax(240px,.75fr)_minmax(0,1.7fr)] items-start gap-6 bg-transparent px-page py-4 pb-8 motion-safe:animate-kanbot-page-enter motion-reduce:animate-none max-[900px]:grid-cols-1 max-md:px-4">
        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-kanbot-ink">
            {t("All sprints")}
            <Button
              variant="primary"
              size="sm"
              className="shrink-0"
              icon={<CalendarPlus size={15} aria-hidden="true" />}
              disabled={loading}
              onClick={() => openSprintForm()}
            >
              {t("Create")}
            </Button>
          </div>
          {loading ? <p className="flex min-h-14 items-center gap-2 text-sm text-kanbot-muted"><Spinner label={t("Loading sprints")} /> {t("Loading sprints…")}</p> : loadError ? <div className="my-2 flex items-center justify-between gap-3 rounded-lg border border-kanbot-danger-border-900/70 bg-kanbot-danger-soft-30 px-3 py-2.5 text-xs text-kanbot-danger-200" role="alert"><span>{loadError}</span><Button variant="danger" size="sm" onClick={() => void refresh()}>{t("Retry")}</Button></div> : sprints.length === 0 ? <p className="rounded-panel border border-dashed border-kanbot-line-strong px-3 py-5 text-xs leading-relaxed text-kanbot-muted">{t("No sprints yet. Create one from the Backlog to start planning.")}</p> : sprints.map((s, index) => (
            <button
              className={`mb-2 grid min-h-[76px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 rounded-panel border px-3.5 py-3 text-start transition duration-200 hover:-translate-y-0.5 motion-safe:animate-kanbot-card-enter motion-reduce:animate-none motion-reduce:hover:translate-y-0 ${selected?.id === s.id ? `border-kanbot-line-strong bg-kanbot-raised ${isArabic ? "shadow-[inset_-4px_0_#9188f5]" : "shadow-[inset_4px_0_#9188f5]"}` : "border-kanbot-line bg-kanbot-panel hover:border-kanbot-line-strong hover:bg-kanbot-hover"}`}
              key={s.id}
              style={{ animationDelay: `${Math.min(index * 65, 325)}ms` }}
              onClick={() => pick(s)}
            >
              <strong className="min-w-0 truncate text-[13px] font-semibold text-kanbot-ink">{s.name}</strong>
              <span className={`${sprintStatusClass(s.status)} justify-self-end`}>
                {t(s.status)}
              </span>
              <small className="col-span-2 text-[11px] text-kanbot-muted">
                {s.startDate ? formatDate(s.startDate) : t("No start")} – {s.endDate ? formatDate(s.endDate) : t("No end")} ·{" "}
                {formatNumber(s.completedStats?.donePoints ?? s.stats.donePoints)}/{formatNumber(s.completedStats?.totalPoints ?? s.stats.totalPoints)} {t("pts")}
              </small>
            </button>
          ))}
        </section>
        {selected && !loading && !loadError && (
          <article key={selected.id} className="min-w-0 rounded-[14px] border border-kanbot-line bg-kanbot-panel p-[18px] motion-safe:animate-kanbot-page-enter motion-reduce:animate-none">
            <h2 className="mb-2 flex flex-wrap items-center gap-2 text-lg font-semibold text-kanbot-ink">
              {selected.name}{" "}
              <span className={sprintStatusClass(selected.status)}>
                {t(selected.status)}
              </span>
            </h2>
            <p className="mb-4 text-xs leading-relaxed text-kanbot-muted">
              {selected.startDate ? formatDate(selected.startDate) : t("No start")} – {selected.endDate ? formatDate(selected.endDate) : t("No end")} · {selected.goal}
            </p>
            <div className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="grid min-h-[84px] content-center gap-2 rounded-panel border border-kanbot-line bg-kanbot-raised p-3.5 text-xs text-kanbot-muted">
                {t("Completed todos")}
                <strong className="text-xl font-semibold text-kanbot-ink">
                  {selected.completedStats?.doneTodos ??
                    selected.stats.doneTodos}
                </strong>
              </div>
              <div className="grid min-h-[84px] content-center gap-2 rounded-panel border border-kanbot-line bg-kanbot-raised p-3.5 text-xs text-kanbot-muted">
                {t("Points done")}
                <strong className="text-xl font-semibold text-kanbot-ink">
                  {selected.completedStats?.donePoints ??
                    selected.stats.donePoints}{" "}
                  /{" "}
                  {selected.completedStats?.totalPoints ??
                    selected.stats.totalPoints}
                </strong>
              </div>
              <div className="grid min-h-[84px] content-center gap-2 rounded-panel border border-kanbot-line bg-kanbot-raised p-3.5 text-xs text-kanbot-muted">
                {t("Carried over")}
                <strong className="text-xl font-semibold text-kanbot-ink">
                  {selected.completedStats?.carriedOver ?? "—"} {t("todos")}
                </strong>
              </div>
              <div className="grid min-h-[84px] content-center gap-2 rounded-panel border border-kanbot-line bg-kanbot-raised p-3.5 text-xs text-kanbot-muted">
                {t("Completion")}
                <strong className="text-xl font-semibold text-kanbot-ink">
                  {selectedStats?.totalTodos
                    ? Math.round(
                        (selectedStats.doneTodos / selectedStats.totalTodos) * 100,
                      )
                    : 0}
                  %
                </strong>
              </div>
            </div>
            <div className="my-4 overflow-hidden rounded-panel border border-kanbot-line bg-kanbot-raised">
              <header className="flex min-h-[50px] items-center justify-between gap-3 border-b border-kanbot-line px-3.5 py-2.5 text-sm font-medium text-kanbot-ink">
                <h3 className="m-0 text-sm font-semibold">✦ {t("AI Summary")}</h3>
                <Button
                  variant="secondary"
                  size="md"
                  loading={summaryLoading}
                  disabled={selected.status === "planned"}
                  icon={<RefreshCw size={15} aria-hidden="true" />}
                  onClick={() => void generateSummary()}
                >
                  {summaryLoading ? t("Generating…") : selected.summary ? t("Regenerate") : t("Generate summary")}
                </Button>
              </header>
              {summaryError && <div className="m-3 flex items-center justify-between gap-3 rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2.5 text-xs text-kanbot-danger-200" role="alert"><span>{summaryError}</span><Button variant="danger" size="sm" onClick={() => void generateSummary()}>{t("Retry")}</Button></div>}
              <article className="p-3.5 text-sm leading-relaxed text-kanbot-zinc-300">
                {selected.summary ? <><small className="mb-3 block text-[11px] text-kanbot-muted">{t("Generated")} {new Intl.DateTimeFormat(isArabic ? "ar-SY" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.summary.generatedAt))}</small><MarkdownContent content={selected.summary.content} /></> : t("Generate a sprint summary to see highlights and suggestions.")}
              </article>
            </div>
            {selected.status === "planned" && (
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button variant="secondary" size="sm" icon={<Pencil size={14} aria-hidden="true" />} onClick={() => openSprintForm(selected)}>{t("Edit sprint")}</Button>
                <Button variant="danger" size="sm" icon={<Trash2 size={14} aria-hidden="true" />} onClick={() => setDeleting(selected)}>{t("Delete planned sprint")}</Button>
              </div>
            )}
          </article>
        )}
      </div>
      <Modal open={sprintForm} title={editing ? t("Edit sprint") : t("Create sprint")} onClose={() => setSprintForm(false)}>
        <form className="grid w-full min-w-0 gap-4 p-5 text-sm text-kanbot-zinc-200" onSubmit={handleSubmit(saveSprint)} noValidate>
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">{t("Name")}<input className="box-border min-h-10 w-full min-w-0 rounded-lg border border-kanbot-line-strong bg-kanbot-input-panel px-3 py-2 text-kanbot-ink focus:border-kanbot-accent focus:outline-none focus:ring-2 focus:ring-kanbot-accent/20" maxLength={80} {...register("name")} placeholder={t("Sprint name")} />{errors.name?.message && <span className="text-kanbot-danger-200" role="alert">{t(errors.name.message)}</span>}</label>
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">{t("Goal")}<input className="box-border min-h-10 w-full min-w-0 rounded-lg border border-kanbot-line-strong bg-kanbot-input-panel px-3 py-2 text-kanbot-ink focus:border-kanbot-accent focus:outline-none focus:ring-2 focus:ring-kanbot-accent/20" maxLength={300} {...register("goal")} placeholder={t("What should this sprint achieve?")} />{errors.goal?.message && <span className="text-kanbot-danger-200" role="alert">{t(errors.goal.message)}</span>}</label>
          <div className="grid w-full min-w-0 grid-cols-2 gap-3 max-[600px]:grid-cols-1"><label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">{t("Start date")}<input className="box-border min-h-10 w-full min-w-0 rounded-lg border border-kanbot-line-strong bg-kanbot-input-panel px-3 py-2 text-kanbot-ink focus:border-kanbot-accent focus:outline-none focus:ring-2 focus:ring-kanbot-accent/20" type="date" {...register("startDate")} /></label><label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">{t("End date")}<input className="box-border min-h-10 w-full min-w-0 rounded-lg border border-kanbot-line-strong bg-kanbot-input-panel px-3 py-2 text-kanbot-ink focus:border-kanbot-accent focus:outline-none focus:ring-2 focus:ring-kanbot-accent/20" type="date" {...register("endDate")} />{errors.endDate?.message && <span className="text-kanbot-danger-200" role="alert">{t(errors.endDate.message)}</span>}</label></div>
          {formError && <p className={formErrorClass} role="alert">{formError}</p>}
          <div className="mt-2 flex justify-end gap-2"><Button variant="primary" size="md" type="submit" icon={<Save size={15} aria-hidden="true" />}>{editing ? t("Save changes") : t("Create sprint")}</Button><Button variant="secondary" size="md" onClick={() => setSprintForm(false)}>{t("Cancel")}</Button></div>
        </form>
      </Modal>
      <Modal open={!!deleting} title={`${t("Delete planned sprint")}${deleting?.name ? ` · ${deleting.name}` : ""}`} onClose={() => { if (!deleteLoading) setDeleting(null); }}>
        <div className="grid gap-4 p-5 text-sm text-kanbot-zinc-300"><p className="leading-relaxed">{t("This planned sprint will be deleted. Its tasks will return to the backlog.")}</p>{formError && <p className={formErrorClass} role="alert">{formError}</p>}<div className="flex justify-end gap-2"><Button variant="danger" size="md" loading={deleteLoading} icon={<Trash2 size={15} aria-hidden="true" />} onClick={async () => {
          if (!deleting || deleteLoading) return;
          setFormError("");
          try { await sprintMutations.delete.mutateAsync(deleting.id); setDeleting(null); setToast({ title: t("Sprint deleted"), message: t("Sprint deleted successfully."), variant: "success" }); }
          catch (error) { setFormError(error instanceof Error ? error.message : "Couldn't delete the sprint."); }
        }}>{deleteLoading ? t("Deleting…") : t("Delete sprint")}</Button><Button variant="secondary" size="md" disabled={deleteLoading} onClick={() => setDeleting(null)}>{t("Cancel")}</Button></div></div>
      </Modal>
      {toast && <div className="fixed bottom-5 end-5 z-[80] w-[min(380px,calc(100vw-32px))]"><Toast title={toast.title} message={toast.message} variant={toast.variant} onClose={() => setToast(null)} /></div>}
    </>
  );
}
