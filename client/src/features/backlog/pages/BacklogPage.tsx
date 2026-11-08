import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { closestCenter, DndContext, KeyboardSensor, pointerWithin, PointerSensor, useSensor, useSensors, type CollisionDetection, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useLocation, useNavigate, useParams } from "react-router";
import { CalendarPlus, Pencil, Play, Plus, Search, Trash2 } from "lucide-react";
import { useSprints, useSprintMutations } from "@features/sprints/hooks/useSprints";
import { useTodoMutations, useTodos } from "@features/todos/hooks/useTodos";
import { TodoDetailsDialog } from "@features/todos";
import type { SprintFormValues } from "@features/sprints";
import {
  EmptyState,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Toast,
} from "@shared/components/ui";
import type { Sprint, Todo, TodoPriority, TodoType } from "@shared/types/api";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import { TodoRow } from "../components/TodoRow";
import { BacklogSprintDialogs } from "../components/BacklogSprintDialogs";
import { TodoDropZone } from "../components/TodoDropZone";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { queryKeys } from "@shared/api/queryKeys";

const errorMessageClass =
  "rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-soft-40 px-3 py-2.5 text-sm text-kanbot-danger-200";
const EMPTY_TODOS: Todo[] = [];
const EMPTY_SPRINTS: Sprint[] = [];
const backlogCollisionDetection: CollisionDetection = (args) => {
  if (args.pointerCoordinates) return pointerWithin(args);
  return closestCenter(args);
};
const quickTodoSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title must be at most 200 characters."),
});
type QuickTodoValues = z.infer<typeof quickTodoSchema>;

function addDaysToDate(value: string, amount: number) {
  return format(addDays(parseISO(value), amount), "yyyy-MM-dd");
}

export function BacklogPage() {
  const { t } = useLanguage();
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const backlogQuery = useTodos(projectId, { sprintId: "backlog" });
  const allTodosQuery = useTodos(projectId);
  const sprintsQuery = useSprints(projectId);
  const refetchBacklog = backlogQuery.refetch;
  const refetchAllTodos = allTodosQuery.refetch;
  const refetchSprints = sprintsQuery.refetch;
  const todoMutations = useTodoMutations(projectId);
  const sprintMutations = useSprintMutations(projectId);
  const backlogTodos = backlogQuery.data?.todos ?? EMPTY_TODOS;
  const allTodos = allTodosQuery.data?.todos ?? EMPTY_TODOS;
  const sprints = sprintsQuery.data?.sprints ?? EMPTY_SPRINTS;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");
  const {
    register: registerQuickTodo,
    handleSubmit: handleQuickTodoSubmit,
    reset: resetQuickTodo,
    control: quickTodoControl,
    formState: { errors: quickTodoErrors },
  } = useForm<QuickTodoValues>({
    resolver: zodResolver(quickTodoSchema),
    defaultValues: { title: "" },
  });
  const quickTodoTitle = useWatch({ control: quickTodoControl, name: "title" }) ?? "";
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [sprintForm, setSprintForm] = useState(false);
  const [sprintStartDate, setSprintStartDate] = useState("");
  const [sprintEndDate, setSprintEndDate] = useState("");
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null);
  const [startingSprint, setStartingSprint] = useState<Sprint | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const loading = backlogQuery.isPending || allTodosQuery.isPending || sprintsQuery.isPending;
  const creatingTodo = todoMutations.create.isPending;
  const [quickCreateError, setQuickCreateError] = useState("");
  const pageError = [backlogQuery.error, allTodosQuery.error, sprintsQuery.error]
    .find((error): error is Error => error instanceof Error)?.message ?? "";
  const [sprintError, setSprintError] = useState("");

  const refresh = useCallback(async () => {
    await Promise.all([refetchBacklog(), refetchAllTodos(), refetchSprints()]);
  }, [refetchAllTodos, refetchBacklog, refetchSprints]);

  useEffect(() => {
    const handleAiTodosSaved = () => {
      void refresh();
    };
    window.addEventListener("backlog-todos-saved", handleAiTodosSaved);
    return () =>
      window.removeEventListener("backlog-todos-saved", handleAiTodosSaved);
  }, [refresh]);

  useEffect(() => {
    const focusTarget = (location.state as { keyboardFocus?: "search" | "new-task" } | null)?.keyboardFocus;
    if (!focusTarget || (focusTarget === "new-task" && loading)) return;

    const selector = focusTarget === "search"
      ? "[data-kanbot-search]"
      : "[data-kanbot-new-task]";
    const input = document.querySelector<HTMLInputElement>(selector);
    if (!input) return;
    input.focus();
    if (focusTarget === "search") input.select();
    navigate(location.pathname, { replace: true, state: null });
  }, [loading, location.pathname, location.state, navigate]);

  const matchesFilters = useCallback(
    (todo: Todo) => {
      const searchText =
        `${todo.key} ${todo.title} ${todo.description} ${todo.assigneeName ?? ""} ${todo.labels.join(" ")}`.toLowerCase();
      return (
        (!debouncedSearch || searchText.includes(debouncedSearch)) &&
        (!priority || todo.priority === priority) &&
        (!type || todo.type === type)
      );
    },
    [debouncedSearch, priority, type],
  );

  const visibleBacklog = useMemo(
    () => backlogTodos.filter(matchesFilters),
    [backlogTodos, matchesFilters],
  );
  const plannedSprints = useMemo(
    () => sprints.filter((sprint) => sprint.status === "planned"),
    [sprints],
  );
  const initialLoadFailed = Boolean(
    pageError &&
    backlogTodos.length === 0 &&
    allTodos.length === 0 &&
    sprints.length === 0,
  );
  const backlogPoints = backlogTodos.reduce(
    (sum, todo) => sum + (todo.storyPoints ?? 0),
    0,
  );
  const hasActiveFilters = Boolean(search.trim() || priority || type);

  const addTodo = async ({ title }: QuickTodoValues) => {
    if (creatingTodo) return;
    setQuickCreateError("");
    try {
      await todoMutations.create.mutateAsync({ title });
      resetQuickTodo();
      await refresh();
    } catch (error) {
      setQuickCreateError(
        error instanceof Error ? error.message : "Couldn't create the task.",
      );
    }
  };

  const openSprintForm = (sprint: Sprint | null = null) => {
    setEditingSprint(sprint);
    setSprintError("");
    setSprintForm(true);
  };

  const saveSprint = async (values: SprintFormValues) => {
    setSprintError("");
    try {
      const body = {
        name: values.name,
        goal: values.goal.trim(),
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      };
      const { sprint } = editingSprint
        ? await sprintMutations.update.mutateAsync({ id: editingSprint.id, body })
        : await sprintMutations.create.mutateAsync(body);
      setSprintForm(false);
      setToast({
        title: editingSprint ? "Sprint updated" : "Sprint created",
        message: `${sprint.name} is ready to plan.`,
        variant: "success",
      });
    } catch (error) {
      setSprintError(
        error instanceof Error ? error.message : "Couldn't save the sprint.",
      );
    }
  };

  const confirmStartSprint = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!startingSprint) return;
    setSprintError("");
    try {
      await sprintMutations.start.mutateAsync({ id: startingSprint.id, body: {
        startDate: sprintStartDate,
        ...(sprintEndDate ? { endDate: sprintEndDate } : {}),
      } });
      const startedName = startingSprint.name;
      setStartingSprint(null);
      navigate(`/projects/${projectId}/board`);
      setToast({
        title: "Sprint started",
        message: `${startedName} is now active.`,
        variant: "success",
      });
    } catch (error) {
      setSprintError(
        error instanceof Error ? error.message : "Couldn't start the sprint.",
      );
    }
  };

  const confirmDeleteSprint = async () => {
    if (!deletingSprint) return;
    setSprintError("");
    try {
      const removedName = deletingSprint.name;
      await sprintMutations.delete.mutateAsync(deletingSprint.id);
      setDeletingSprint(null);
      setToast({
        title: "Sprint deleted",
        message: `${removedName} was removed and its tasks returned to the backlog.`,
        variant: "success",
      });
    } catch (error) {
      setSprintError(
        error instanceof Error ? error.message : "Couldn't delete the sprint.",
      );
    }
  };

  const optimisticMove = (
    todoId: string,
    targetSprintId: string | null,
    position: number,
  ) => {
    const previousAll = allTodos;
    const previousBacklog = backlogTodos;
    const moving = previousAll.find((todo) => todo.id === todoId);
    if (
      !moving ||
      (moving.sprintId === targetSprintId && moving.order === position)
    )
      return;

    const sourceSprintId = moving.sprintId;
    const belongsToList = (todo: Todo, sprintId: string | null) =>
      todo.sprintId === sprintId &&
      (sprintId === null || todo.status === moving.status);
    const targetList = previousAll
      .filter(
        (todo) => belongsToList(todo, targetSprintId) && todo.id !== todoId,
      )
      .sort((a, b) => a.order - b.order);
    const insertAt = Math.max(0, Math.min(position, targetList.length));
    targetList.splice(insertAt, 0, { ...moving, sprintId: targetSprintId });
    const updatedTarget = targetList.map((todo, order) => ({ ...todo, order }));
    const updatedSource =
      sourceSprintId === targetSprintId
        ? []
        : previousAll
            .filter(
              (todo) =>
                belongsToList(todo, sourceSprintId) && todo.id !== todoId,
            )
            .sort((a, b) => a.order - b.order)
            .map((todo, order) => ({ ...todo, order }));
    const untouched = previousAll.filter(
      (todo) =>
        !belongsToList(todo, sourceSprintId) &&
        !belongsToList(todo, targetSprintId),
    );
    const nextAll = [
      ...untouched,
      ...(sourceSprintId === targetSprintId ? updatedTarget : updatedSource),
      ...(sourceSprintId === targetSprintId ? [] : updatedTarget),
    ];
    queryClient.setQueryData(queryKeys.todos(projectId), { todos: nextAll });
    queryClient.setQueryData(queryKeys.todos(projectId, { sprintId: "backlog" }), {
      todos: nextAll.filter((todo) => todo.sprintId === null).sort((a, b) => a.order - b.order),
    });

    void todoMutations.move.mutateAsync({ id: todoId, body: { sprintId: targetSprintId, position } })
      .then(() => refresh())
      .then(() =>
        setToast({
          title: "Task moved",
          message: targetSprintId
            ? `Moved to ${sprints.find((sprint) => sprint.id === targetSprintId)?.name ?? "sprint"}.`
            : "Moved to the backlog.",
          variant: "success",
        }),
      )
      .catch((error: unknown) => {
        queryClient.setQueryData(queryKeys.todos(projectId), { todos: previousAll });
        queryClient.setQueryData(queryKeys.todos(projectId, { sprintId: "backlog" }), { todos: previousBacklog });
        setToast({
          title: "Task move failed",
          message: `${error instanceof Error ? error.message : "The server could not save this move."} Your previous order was restored.`,
          variant: "error",
        });
      });
  };

  const todoRow = (todo: Todo, index = 0) => (
    <TodoRow
      key={todo.id}
      todo={todo}
      sprints={sprints}
      animationDelayMs={Math.min(index * 32, 224)}
      onOpen={setSelectedTodo}
      onMove={optimisticMove}
    />
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const moving = allTodos.find((todo) => todo.id === String(active.id));
    if (!moving) return;
    const overTodo = allTodos.find((todo) => todo.id === String(over.id));
    const overData = over.data.current as { sprintId?: string | null } | undefined;
    const targetSprintId = overTodo?.sprintId ?? overData?.sprintId ?? null;
    const destination = allTodos
      .filter((todo) => todo.sprintId === targetSprintId && (targetSprintId === null || todo.status === moving.status) && todo.id !== moving.id)
      .sort((a, b) => a.order - b.order);
    if (overTodo?.id === moving.id) return;

    const targetIndex = overTodo && overTodo.sprintId === targetSprintId && (targetSprintId === null || overTodo.status === moving.status)
      ? destination.findIndex((todo) => todo.id === overTodo.id)
      : -1;
    const activeRect = active.rect.current.translated;
    const shouldInsertAfter = Boolean(
      overTodo &&
      targetIndex >= 0 &&
      activeRect &&
      activeRect.top + activeRect.height / 2 > over.rect.top + over.rect.height / 2,
    );
    const position = targetIndex < 0
      ? destination.length
      : targetIndex + Number(shouldInsertAfter);
    optimisticMove(moving.id, targetSprintId, position);
  };

  return (
    <>
      <header className="flex min-h-[76px] items-center justify-between gap-3 border-b border-kanbot-line bg-transparent px-page py-4 max-md:min-h-[66px] max-md:px-4">
        <h1 className="m-0 text-xl font-semibold tracking-tight text-kanbot-ink max-md:text-lg">
          {t("Backlog")}{" "}
          <small className="ms-3 text-xs font-normal text-kanbot-muted">
            {initialLoadFailed
              ? t("Tasks unavailable")
              : `${backlogTodos.length} todos · ${backlogPoints} pts`}
          </small>
        </h1>
      </header>

      <div className="box-content min-h-[calc(100vh-168px)] bg-transparent px-page pb-16 pt-4 motion-safe:animate-kanbot-page-enter motion-reduce:animate-none max-md:px-4">
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <label className="relative flex min-w-64 flex-1 items-center">
            <Search
              className="pointer-events-none absolute left-3 text-kanbot-zinc-400 rtl:left-auto rtl:right-3"
              size={17}
              aria-hidden="true"
            />
            <input
              className="!min-h-[42px] !w-full !rounded-lg !border !border-kanbot-line-strong !bg-kanbot-panel !pl-10 !pr-3 !text-kanbot-ink placeholder:!text-kanbot-subtle focus:!border-kanbot-accent focus:!ring-2 focus:!ring-kanbot-accent/20 rtl:!pl-3 rtl:!pr-10"
              type="search"
              data-kanbot-search
              aria-label={t("Search backlog tasks")}
              placeholder={t("Search by title, key, assignee, or label…")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <Select
            value={priority || null}
            onValueChange={(value) =>
              setPriority(typeof value === "string" ? value : "")
            }
          >
            <SelectTrigger
              className="!min-h-[42px] !min-w-[145px] !rounded-lg !border-kanbot-line-strong !bg-kanbot-panel !text-kanbot-ink"
              aria-label={t("Filter by priority")}
            >
              <SelectValue placeholder={t("All priorities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>{t("All priorities")}</SelectItem>
              {(["low", "medium", "high", "urgent"] as TodoPriority[]).map(
                (value) => (
                  <SelectItem key={value} value={value}>
                    {t(value[0].toUpperCase() + value.slice(1))}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select
            value={type || null}
            onValueChange={(value) =>
              setType(typeof value === "string" ? value : "")
            }
          >
            <SelectTrigger
              className="!min-h-[42px] !min-w-[145px] !rounded-lg !border-kanbot-line-strong !bg-kanbot-panel !text-kanbot-ink"
              aria-label={t("Filter by type")}
            >
              <SelectValue placeholder={t("All types")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>{t("All types")}</SelectItem>
              {(["task", "story", "bug"] as TodoType[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {t(value[0].toUpperCase() + value.slice(1))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="flex-1 max-lg:hidden" />
          <Button
            variant="primary"
            size="md"
            className="min-h-[42px] px-3.5 text-xs"
            icon={<CalendarPlus size={15} aria-hidden="true" />}
            onClick={() => openSprintForm()}
          >
            {t("Create sprint")}
          </Button>
        </div>

        {pageError && !initialLoadFailed && (
          <p className={errorMessageClass} role="alert">
            {pageError}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-kanbot-muted">
            <Spinner label={t("Loading backlog")} /> {t("Loading backlog…")}
          </div>
        ) : initialLoadFailed ? (
          <EmptyState
            className="!min-h-48 !rounded-panel !border-kanbot-danger-border-900 !bg-kanbot-danger-soft-20 !text-kanbot-ink"
            title={t("Couldn't load your backlog")}
            description={`${pageError}. Your tasks have not been removed; reconnect to the server and try again.`}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void refresh();
                }}
              >
                {t("Retry")}
              </Button>
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={backlogCollisionDetection}
            onDragEnd={handleDragEnd}
          >
            {plannedSprints.map((sprint) => {
              const sprintTodos = allTodos
                .filter((todo) => todo.sprintId === sprint.id)
                .filter(matchesFilters);
              const sprintCount = allTodos.filter(
                (todo) => todo.sprintId === sprint.id,
              ).length;
              return (
                <TodoDropZone
                  as="section"
                  id={`sprint:${sprint.id}`}
                  sprintId={sprint.id}
                  className="mb-4 overflow-hidden rounded-panel border border-kanbot-line bg-kanbot-panel shadow-sm"
                  key={sprint.id}
                >
                  <div className="flex min-h-[50px] flex-wrap items-center gap-2.5 border-b border-kanbot-line bg-kanbot-raised px-4 py-2.5 text-[13px] font-medium text-kanbot-ink">
                    <strong>
                      {sprint.name}{" "}
                  <span className="ms-1.5 inline-flex rounded border border-kanbot-warning-border-800/70 bg-kanbot-warning-soft-40 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-kanbot-warning-300">{t("Planned")}</span>
                    </strong>
                    <span>{sprintCount} todos</span>
                    <div className="ms-auto flex flex-wrap items-center gap-2 max-sm:w-full max-sm:justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Pencil size={14} aria-hidden="true" />}
                        onClick={() => openSprintForm(sprint)}
                      >
                        {t("Edit sprint")}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="px-3.5"
                        icon={<Play size={14} fill="currentColor" aria-hidden="true" />}
                        onClick={() => {
                          const start =
                            sprint.startDate ??
                            new Date().toISOString().slice(0, 10);
                          setSprintError("");
                          setSprintStartDate(start);
                          setSprintEndDate(
                            sprint.endDate ?? addDaysToDate(start, 14),
                          );
                          setStartingSprint(sprint);
                        }}
                      >
                        {t("Start sprint")}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={14} aria-hidden="true" />}
                        onClick={() => {
                          setSprintError("");
                          setDeletingSprint(sprint);
                        }}
                      >
                        {t("Delete")}
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-[1320px]:overflow-x-hidden">
                    <div className="min-w-[980px] max-[1320px]:min-w-0">
                      <div className="grid min-h-[42px] min-w-[980px] grid-cols-[24px_72px_minmax(190px,2fr)_minmax(145px,1.25fr)_82px_112px_72px_22px] items-center gap-3 border-b border-kanbot-line bg-kanbot-table-head px-4 text-center text-[10px] font-semibold uppercase tracking-wider text-kanbot-muted max-[1320px]:hidden">
                        <span aria-hidden="true" />
                        <span>{t("Key")}</span>
                        <span>{t("Task")}</span>
                        <span>{t("Assignee")}</span>
                        <span>{t("Type")}</span>
                        <span>{t("Priority")}</span>
                        <span>{t("Points")}</span>
                        <span aria-hidden="true" />
                      </div>
                      <SortableContext items={sprintTodos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
                        {sprintTodos.map(todoRow)}
                      </SortableContext>
                    </div>
                  </div>
                  {sprintTodos.length === 0 && (
                    <p className="px-4 py-5 text-center text-xs text-kanbot-muted">
                      {t("No tasks in this sprint yet.")}
                    </p>
                  )}
                </TodoDropZone>
              );
            })}

            <TodoDropZone
              as="section"
              id="backlog"
              sprintId={null}
              className="mb-4 overflow-hidden rounded-panel border border-kanbot-line bg-kanbot-panel shadow-sm"
            >
              <div className="flex min-h-[50px] items-center gap-2.5 border-b border-kanbot-line bg-kanbot-raised px-4 py-2.5 text-[13px] font-medium text-kanbot-ink">
                <strong>{t("Backlog")}</strong>
                <span>
                  {visibleBacklog.length}
                  {hasActiveFilters ? ` of ${backlogTodos.length}` : ""} todos ·{" "}
                  {backlogPoints} pts total
                </span>
              </div>
              <div className="overflow-x-auto max-[1320px]:overflow-x-hidden">
                <div className="min-w-[980px] max-[1320px]:min-w-0">
                  <div className="grid min-h-[42px] min-w-[980px] grid-cols-[24px_72px_minmax(190px,2fr)_minmax(145px,1.25fr)_82px_112px_72px_22px] items-center gap-3 border-b border-kanbot-line bg-kanbot-table-head px-4 text-center text-[10px] font-semibold uppercase tracking-wider text-kanbot-muted max-[1320px]:hidden">
                    <span aria-hidden="true" />
                    <span>{t("Key")}</span>
                    <span>{t("Task")}</span>
                    <span>{t("Assignee")}</span>
                    <span>{t("Type")}</span>
                    <span>{t("Priority")}</span>
                    <span>{t("Points")}</span>
                    <span aria-hidden="true" />
                  </div>
                  <SortableContext items={visibleBacklog.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
                    {visibleBacklog.map(todoRow)}
                  </SortableContext>
                </div>
              </div>
              {visibleBacklog.length === 0 && (
                <EmptyState
                  className="!min-h-[190px] !rounded-none !border-0 !border-t !border-kanbot-line !bg-kanbot-panel !text-kanbot-ink"
                  title={
                    hasActiveFilters
                      ? t("No tasks match these filters")
                      : t("Your backlog is empty")
                  }
                  description={
                    hasActiveFilters
                      ? t("Try changing the search or filters.")
                      : t("Add your first task below, or use AI to draft a list.")
                  }
                />
              )}
              <form
                className=" flex min-h-[62px] items-center gap-2.5 border-t border-kanbot-line bg-kanbot-raised px-5 py-4 max-sm:flex-wrap max-sm:px-4"
                onSubmit={handleQuickTodoSubmit(addTodo)}
                noValidate
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-kanbot-line-strong text-kanbot-muted" aria-hidden="true">
                  ＋
                </span>
                <input
                  data-kanbot-new-task
                  className="min-h-[42px] min-w-0 flex-1 rounded-lg border border-kanbot-line-strong bg-kanbot-input-panel px-3 text-sm text-kanbot-ink placeholder:text-kanbot-subtle focus:border-kanbot-accent focus:outline-none focus:ring-2 focus:ring-kanbot-accent/20 max-sm:basis-full"
                  aria-label={t("Create a task in the backlog")}
                  aria-invalid={Boolean(quickTodoErrors.title)}
                  placeholder={t("Add a task to the backlog…")}
                  disabled={creatingTodo}
                  maxLength={200}
                  {...registerQuickTodo("title")}
                />
                <Button
                  variant="primary"
                  size="md"
                  className="min-h-[42px] max-sm:ms-auto"
                  type="submit"
                  icon={<Plus size={15} aria-hidden="true" />}
                  loading={creatingTodo}
                  disabled={creatingTodo || !quickTodoTitle.trim()}
                  aria-busy={creatingTodo}
                >
                  {creatingTodo ? t("Adding…") : t("Add task")}
                </Button>
              </form>
              {quickCreateError && (
                <p className={`${errorMessageClass} mx-5 mb-3 max-sm:mx-4`} role="alert">
                  {quickCreateError}
                </p>
              )}
              {quickTodoErrors.title?.message && (
                <p className={`${errorMessageClass} mx-5 mb-3 max-sm:mx-4`} role="alert">
                  {t(quickTodoErrors.title.message)}
                </p>
              )}
            </TodoDropZone>
          </DndContext>
        )}
      </div>

      {selectedTodo && (
        <TodoDetailsDialog
          key={selectedTodo.id}
          todo={selectedTodo}
          sprints={sprints}
          onClose={() => setSelectedTodo(null)}
          onChanged={refresh}
        />
      )}

      <BacklogSprintDialogs
        sprintFormOpen={sprintForm}
        editingSprint={editingSprint}
        sprintStartDate={sprintStartDate}
        onSprintStartDateChange={setSprintStartDate}
        sprintEndDate={sprintEndDate}
        onSprintEndDateChange={setSprintEndDate}
        sprintError={sprintError}
        onSaveSprint={(values) => void saveSprint(values)}
        onCloseSprintForm={() => setSprintForm(false)}
        startingSprint={startingSprint}
        onConfirmStartSprint={(event) => void confirmStartSprint(event)}
        onCloseStartSprint={() => setStartingSprint(null)}
        deletingSprint={deletingSprint}
        onConfirmDeleteSprint={() => void confirmDeleteSprint()}
        onCloseDeleteSprint={() => setDeletingSprint(null)}
      />
      {toast && (
        <div className="fixed bottom-5 end-5 z-[120] w-[min(380px,calc(100vw-40px))]">
          <Toast
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </>
  );
}

