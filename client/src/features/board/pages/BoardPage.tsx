import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { closestCenter, DndContext, DragOverlay, KeyboardSensor, pointerWithin, PointerSensor, useSensor, useSensors, type CollisionDetection, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { useAiActions } from "@features/ai/hooks/useAi";
import { useSprintBoard, useSprintMutations, useSprints } from "@features/sprints/hooks/useSprints";
import { useTodoMutations } from "@features/todos/hooks/useTodos";
import { queryKeys } from "@shared/api/queryKeys";
import { MarkdownContent } from "@shared/components";
import type { SprintBoardResponse, Todo, TodoStatus } from "@shared/types/api";
import { Button, Modal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Toast } from "@shared/components/ui";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import { BoardColumn } from "../components/BoardColumn";
import { BoardTodoCardPreview } from "../components/BoardTodoCard";

const columns: { status: TodoStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review", label: "In Review" },
  { status: "done", label: "Done" },
];

const boardCollisionDetection: CollisionDetection = (args) => {
  if (args.pointerCoordinates) return pointerWithin(args);
  return closestCenter(args);
};

function daysUntil(endDate: string | null) {
  if (!endDate) return null;
  return differenceInCalendarDays(parseISO(endDate), new Date());
}

export function BoardPage() {
  const { t, isArabic, formatDate, formatNumber } = useLanguage();
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sprintsQuery = useSprints(projectId);
  const sprints = sprintsQuery.data?.sprints ?? [];
  const activeSprint = sprints.find((item) => item.status === "active") ?? null;
  const boardQuery = useSprintBoard(activeSprint?.id);
  const boardData = boardQuery.data;
  const sprint = boardData?.sprint ?? null;
  const board = boardData?.columns ?? null;
  const sprintMutations = useSprintMutations(projectId);
  const todoMutations = useTodoMutations(projectId);
  const aiActions = useAiActions(projectId);
  const [complete, setComplete] = useState(false);
  const [target, setTarget] = useState("backlog");
  const [generateSummaryAfterComplete, setGenerateSummaryAfterComplete] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [completeError, setCompleteError] = useState("");
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);
  const summaryLoading = aiActions.summarizeSprint.isPending;
  const [finishing, setFinishing] = useState(false);
  const completing = sprintMutations.complete.isPending || finishing;
  const loading = sprintsQuery.isPending || Boolean(activeSprint && boardQuery.isPending);
  const pageError = sprintsQuery.error instanceof Error
    ? sprintsQuery.error.message
    : boardQuery.error instanceof Error
      ? boardQuery.error.message
      : "";
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const refresh = async () => {
    await sprintsQuery.refetch({ throwOnError: true });
    if (activeSprint) await boardQuery.refetch({ throwOnError: true });
  };

  const totalPoints = sprint?.stats.totalPoints ?? 0;
  const donePoints = sprint?.stats.donePoints ?? 0;
  const totalTodos = sprint?.stats.totalTodos ?? 0;
  const doneTodos = sprint?.stats.doneTodos ?? 0;
  const progress = totalTodos ? Math.round((doneTodos / totalTodos) * 100) : 0;
  const remaining = daysUntil(sprint?.endDate ?? null);

  const generateSummary = async () => {
    if (!sprint || summaryLoading) return;
    setSummaryError("");
    try {
      await aiActions.summarizeSprint.mutateAsync(sprint.id);
      setSummaryOpen(true);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Couldn't create the sprint summary.");
    }
  };

  const optimisticallyMove = async (todoId: string, nextStatus: TodoStatus, position: number) => {
    if (!sprint || !board) return;
    const key = queryKeys.board(sprint.id);
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<SprintBoardResponse>(key) ?? boardData;
    const currentBoard = previous?.columns ?? board;
    const sourceStatus = columns.find(({ status }) => currentBoard[status].some((todo) => todo.id === todoId))?.status;
    if (!sourceStatus) return;
    const moving = currentBoard[sourceStatus].find((todo) => todo.id === todoId);
    if (!moving) return;

    const destination = currentBoard[nextStatus].filter((todo) => todo.id !== todoId);
    const index = Math.max(0, Math.min(position, destination.length));
    destination.splice(index, 0, { ...moving, status: nextStatus, order: index });
    const nextBoard = { ...currentBoard, [nextStatus]: destination };
    if (sourceStatus !== nextStatus) {
      nextBoard[sourceStatus] = currentBoard[sourceStatus].filter((todo) => todo.id !== todoId);
      nextBoard[sourceStatus] = nextBoard[sourceStatus].map((todo, order) => ({ ...todo, order }));
    }
    nextBoard[nextStatus] = nextBoard[nextStatus].map((todo, order) => ({ ...todo, order }));
    queryClient.setQueryData<SprintBoardResponse>(key, { ...previous!, columns: nextBoard });

    try {
      await todoMutations.move.mutateAsync({ id: todoId, body: { status: nextStatus, position: index } });
    } catch (error) {
      if (previous) queryClient.setQueryData(key, previous);
      setToast({
        title: "Task move failed",
        message: `${error instanceof Error ? error.message : "The server could not save the move."} The card returned to its previous column and position.`,
        variant: "error",
      });
      return;
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedTodo(null);
    if (!over || !board) return;
    const draggedId = String(active.id);
    const targetTodo = Object.values(board).flat().find((todo) => todo.id === String(over.id));
    const targetStatus = (targetTodo?.status ?? over.data.current?.status) as TodoStatus | undefined;
    if (!targetStatus || !columns.some((column) => column.status === targetStatus)) return;
    if (targetTodo?.id === draggedId) return;
    const destination = board[targetStatus].filter((todo) => todo.id !== draggedId);
    const targetIndex = targetTodo ? destination.findIndex((todo) => todo.id === targetTodo.id) : destination.length;
    const activeRect = active.rect.current.translated;
    const droppedAfterTarget = Boolean(
      targetTodo &&
      activeRect &&
      activeRect.top + activeRect.height / 2 > over.rect.top + over.rect.height / 2,
    );
    const insertionIndex = targetIndex < 0
      ? destination.length
      : targetIndex + Number(droppedAfterTarget);
    void optimisticallyMove(draggedId, targetStatus, insertionIndex);
  };

  const daysLabel = remaining === null
    ? t("No end date set")
    : remaining > 1
      ? `${formatNumber(remaining)} ${t("days remaining")}`
      : remaining === 1
        ? t("day remaining")
        : remaining === 0
          ? t("Ends today")
          : `${t("Ended")} ${formatNumber(Math.abs(remaining))} ${t("days ago")}`;

  return (
    <>
      <header className="flex min-h-[76px] items-center justify-between border-b border-kanbot-line bg-transparent px-page py-4"><h1 className="m-0 text-xl font-semibold text-kanbot-ink">{t("Active Sprint")}</h1></header>
      <div className="min-h-[calc(100vh-168px)] bg-transparent px-page pb-8 pt-4 max-[769px]:px-4">
        {pageError && <p className="mb-3 rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2.5 text-sm text-kanbot-danger-200" role="alert">{pageError}</p>}
        {loading ? (
          <div className="flex min-h-56 items-center justify-center text-sm text-kanbot-muted">{t("Loading active sprint…")}</div>
        ) : pageError && !board ? (
          <div className="mx-auto grid min-h-64 max-w-xl content-center justify-items-center gap-3 rounded-panel border border-dashed border-kanbot-line-strong bg-kanbot-panel p-8 text-center">
            <h2>{t("Couldn't load the sprint board")}</h2>
            <p>{t("Your sprint data wasn't removed. Check the API server, then retry.")}</p>
            <Button variant="secondary" size="md" onClick={() => void refresh().catch(() => undefined)}>{t("Retry")}</Button>
          </div>
        ) : sprint && board ? (
          <>
        <section className="relative mb-5 flex items-stretch gap-6 overflow-hidden rounded-panel border border-kanbot-line bg-[radial-gradient(ellipse_at_8%_0%,rgb(99_102_241_/_12%),transparent_48%),#141416] p-6 motion-safe:animate-kanbot-page-enter motion-reduce:animate-none max-[769px]:flex-col max-[769px]:p-4">
              <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-indigo-400 via-violet-400 to-emerald-400 rtl:left-auto rtl:right-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-kanbot-muted"><span className="size-2 rounded-full bg-kanbot-emerald-400 shadow-[0_0_0_3px_rgb(74_222_128_/_12%)]" />{t("Active sprint")}</span>
                    <h2 className="mt-1 text-xl font-semibold text-kanbot-ink">{sprint.name}</h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-kanbot-line-strong bg-kanbot-raised px-3 py-1.5 text-[11px] font-medium text-kanbot-zinc-300">{daysLabel}</span>
                </div>
                <p className="my-3 flex gap-2 text-xs text-kanbot-muted"><strong className="text-kanbot-zinc-300">{t("Goal")}</strong>{sprint.goal || t("No sprint goal set")}</p>
                <div className="flex items-center gap-2 text-[11px] text-kanbot-muted">
                  <CalendarDays className="text-kanbot-indigo-300" size={15} aria-hidden="true" />
                  <span>{sprint.startDate ? formatDate(sprint.startDate) : t("Start date not set")}</span><span aria-hidden="true">→</span><span>{sprint.endDate ? formatDate(sprint.endDate) : t("End date not set")}</span>
                </div>
                <div className="mt-5 flex max-w-[680px] justify-between gap-3 text-[11px] text-kanbot-zinc-300"><strong>{t("Sprint progress")}</strong><span className="text-kanbot-muted">{formatNumber(doneTodos)} {t("of")} {formatNumber(totalTodos)} {t("tasks")} · {formatNumber(donePoints)}/{formatNumber(totalPoints)} {t("pts")}</span></div>
                <div className="mt-2 h-2.5 w-full max-w-[680px] overflow-hidden rounded-full bg-kanbot-hover" role="progressbar" aria-label={t("Sprint task completion")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                  <span className="block h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-[width] duration-300" style={{ width: `${progress}%` }} />
                </div>
                <small className="text-[10px] text-kanbot-muted">{formatNumber(progress)}% {t("complete")}</small>
              </div>
              <div className="flex items-start gap-2 max-[769px]:flex-wrap">
                <Button
                  variant="secondary"
                  size="md"
                  loading={summaryLoading}
                  icon={sprint.summary ? <RefreshCw size={15} aria-hidden="true" /> : <Sparkles size={15} aria-hidden="true" />}
                  onClick={() => void generateSummary()}
                >
                  {summaryLoading ? t("Generating…") : sprint.summary ? t("Regenerate summary") : t("Summarize")}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={<CheckCircle2 size={16} aria-hidden="true" />}
                  onClick={() => { setTarget("backlog"); setGenerateSummaryAfterComplete(false); setCompleteError(""); setComplete(true); }}
                >
                  {t("Complete sprint")}
                </Button>
              </div>
            </section>

            <DndContext
              sensors={sensors}
              collisionDetection={boardCollisionDetection}
              onDragStart={({ active }) => setDraggedTodo(Object.values(board).flat().find((todo) => todo.id === String(active.id)) ?? null)}
              onDragCancel={() => setDraggedTodo(null)}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-4 items-start gap-3.5 max-[1100px]:grid-cols-2 max-[769px]:flex max-[769px]:overflow-x-auto max-[769px]:gap-3 max-[769px]:pb-2 max-[769px]:[scroll-snap-type:x_proximity]">
                {columns.map(({ status }, columnIndex) => (
                  <BoardColumn
                    key={status}
                    status={status}
                    todos={board[status]}
                    countLabel={`${formatNumber(board[status].length)} ${t("tasks")}`}
                    highlight={false}
                    animationDelay={columnIndex * 85}
                    onStatusChange={(todoId, nextStatus) => void optimisticallyMove(todoId, nextStatus, board[nextStatus].length)}
                  />
                ))}
              </div>
              <DragOverlay dropAnimation={null}>
                {draggedTodo ? <div dir={isArabic ? "rtl" : "ltr"} className="w-[min(320px,80vw)]"><BoardTodoCardPreview todo={draggedTodo} /></div> : null}
              </DragOverlay>
            </DndContext>

            {summaryError && <div className="my-3 flex items-center justify-between gap-3 rounded-lg border border-kanbot-danger-border-900/70 bg-kanbot-danger-soft-30 px-3 py-2.5 text-xs text-kanbot-danger-200" role="alert"><span>{summaryError}</span><Button variant="danger" size="sm" onClick={() => void generateSummary()}>{t("Retry")}</Button></div>}
            {sprint.summary && <section className="my-4 overflow-hidden rounded-panel border border-kanbot-line bg-kanbot-panel">
              <header className="flex min-h-12 flex-wrap items-center gap-3 border-b border-kanbot-line bg-kanbot-raised px-4 py-3"><h3 className="me-auto text-sm font-semibold text-kanbot-ink">✦ {t("Sprint summary")}</h3><small className="text-[10px] text-kanbot-muted">{t("Generated")} {new Intl.DateTimeFormat(isArabic ? "ar-SY" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(sprint.summary.generatedAt))}</small><Button variant="secondary" size="md" loading={summaryLoading} icon={<RefreshCw size={15} aria-hidden="true" />} onClick={() => void generateSummary()}>{summaryLoading ? t("Generating…") : t("Regenerate")}</Button></header>
              <article className="p-4 text-sm leading-relaxed text-kanbot-zinc-300"><MarkdownContent content={sprint.summary.content} /></article>
            </section>}
          </>
        ) : (
          <div className="mx-auto grid min-h-64 max-w-xl content-center justify-items-center gap-3 rounded-panel border border-dashed border-kanbot-line-strong bg-kanbot-panel p-8 text-center">
            <h2>{t("No active sprint")}</h2>
            <p>{t("Plan a sprint in Backlog, then start it to work on the board.")}</p>
            <Button variant="secondary" size="md" onClick={() => navigate(`/projects/${projectId}/backlog`)}>{t("Open backlog")}</Button>
          </div>
        )}
      </div>

      <Modal open={complete} title={`${t("Complete sprint")}${sprint?.name ? ` · ${sprint.name}` : ""}`} onClose={() => { if (!completing) setComplete(false); }} size="compact">
        <form className="grid w-full min-w-0 gap-4 p-5 text-sm text-kanbot-zinc-200" onSubmit={async (event) => {
          event.preventDefault();
          if (!sprint || completing) return;
          setFinishing(true);
          setCompleteError("");
          try {
            await sprintMutations.complete.mutateAsync({ id: sprint.id, body: { moveUnfinishedTo: target } });
            let summaryFailure = "";
            if (generateSummaryAfterComplete) {
              try {
                await aiActions.summarizeSprint.mutateAsync(sprint.id);
              } catch (error) {
                summaryFailure = error instanceof Error ? error.message : "The summary could not be generated.";
              }
            }
            setComplete(false);
            setToast({
              title: t("Sprint completed"),
              message: summaryFailure ? `${sprint.name} is in your history. Summary unavailable: ${summaryFailure}` : `${sprint.name} is now in your sprint history.${generateSummaryAfterComplete ? " AI summary generated." : ""}`,
              variant: summaryFailure ? "error" : "success",
            });
            navigate(`/projects/${projectId}/sprints?selected=${sprint.id}`);
          } catch (error) {
            setCompleteError(error instanceof Error ? error.message : "Couldn't complete the sprint.");
          } finally {
            setFinishing(false);
          }
        }}>
          <p className="m-0 text-sm leading-relaxed text-kanbot-muted">{formatNumber(doneTodos)} {t("of")} {formatNumber(totalTodos)} {t("tasks complete")} · {formatNumber(donePoints)} {t("of")} {formatNumber(totalPoints)} {t("points")}. {t("Unfinished tasks can return to the backlog or move to a planned sprint.")}</p>
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-kanbot-zinc-300">{t("Move unfinished tasks to")}
            <Select value={target} onValueChange={(value) => { if (typeof value === "string") setTarget(value); }}>
              <SelectTrigger aria-label={t("Move unfinished tasks to")}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="backlog">{t("Backlog")}</SelectItem>{sprints.filter((item) => item.status === "planned").map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="flex items-center gap-2 text-xs text-kanbot-zinc-300"><input className="size-4 accent-violet-400" type="checkbox" checked={generateSummaryAfterComplete} onChange={(event) => setGenerateSummaryAfterComplete(event.target.checked)} /><span>{t("Generate an AI summary after completion")}</span></label>
          {completeError && <p className="rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2.5 text-sm text-kanbot-danger-200" role="alert">{completeError}</p>}
          <div className="mt-2 flex justify-end gap-2"><Button variant="primary" size="md" type="submit" loading={completing} icon={<CheckCircle2 size={16} aria-hidden="true" />}>{completing ? t("Completing…") : t("Complete sprint")}</Button><Button variant="secondary" size="md" disabled={completing} onClick={() => setComplete(false)}>{t("Cancel")}</Button></div>
        </form>
      </Modal>

      <Modal open={summaryOpen && !!sprint?.summary} title={t("Sprint summary")} onClose={() => setSummaryOpen(false)}>
        {sprint?.summary && <><p className="mb-3 text-[11px] text-kanbot-muted">{t("Generated")} {new Intl.DateTimeFormat(isArabic ? "ar-SY" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(sprint.summary.generatedAt))}</p><article className="text-sm leading-relaxed text-kanbot-zinc-300"><MarkdownContent content={sprint.summary.content} /></article></>}
      </Modal>

      {toast && <div className="fixed bottom-5 end-5 z-[80] w-[min(380px,calc(100vw-32px))]"><Toast title={toast.title} message={toast.message} variant={toast.variant} onClose={() => setToast(null)} /></div>}
    </>
  );
}
