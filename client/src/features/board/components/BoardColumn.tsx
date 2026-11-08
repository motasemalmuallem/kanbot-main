import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Check, CircleDot, Eye, ListTodo } from "lucide-react";
import type { Todo, TodoStatus } from "@shared/types/api";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import { BoardTodoCard } from "./BoardTodoCard";

const columns: { status: TodoStatus; label: string; icon: typeof CircleDot; accent: string }[] = [
  { status: "todo", label: "To Do", icon: CircleDot, accent: "border-t-indigo-400 text-kanbot-indigo-300" },
  { status: "in_progress", label: "In Progress", icon: ListTodo, accent: "border-t-sky-400 text-kanbot-sky-300" },
  { status: "in_review", label: "In Review", icon: Eye, accent: "border-t-amber-400 text-kanbot-warning-300" },
  { status: "done", label: "Done", icon: Check, accent: "border-t-emerald-400 text-kanbot-success-300" },
];

type BoardColumnProps = {
  status: TodoStatus;
  todos: Todo[];
  countLabel: string;
  highlight: boolean;
  animationDelay: number;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
};

export function BoardColumn({ status, todos, countLabel, highlight, animationDelay, onStatusChange }: BoardColumnProps) {
  const { t } = useLanguage();
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}`, data: { status } });
  const column = columns.find((item) => item.status === status)!;
  const StatusIcon = column.icon;

  return (
    <section
      ref={setNodeRef}
      className={`relative min-h-[58vh] min-w-0 overflow-hidden rounded-xl border px-3 pb-3 motion-safe:animate-kanbot-card-enter motion-reduce:animate-none max-[769px]:min-h-0 max-[769px]:w-[min(82vw,320px)] max-[769px]:min-w-[260px] max-[769px]:shrink-0 max-[769px]:[scroll-snap-align:start] ${highlight || isOver ? "border-kanbot-accent bg-kanbot-violet-soft-strong shadow-[inset_0_0_0_1px_rgb(129_123_255_/_35%)]" : "border-kanbot-line bg-kanbot-panel"}`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <header className={`-mx-3 mb-2 flex min-h-[52px] items-center justify-between border-t-[3px] px-3 pt-1 ${column.accent}`}>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-kanbot-ink"><StatusIcon size={16} aria-hidden="true" />{t(column.label)}</span>
        <span className="grid size-6 place-items-center rounded-full border border-kanbot-line-strong bg-kanbot-raised text-[11px] font-semibold text-kanbot-zinc-300" aria-label={countLabel}>{todos.length}</span>
      </header>
      <SortableContext items={todos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
        <div className="grid min-h-[52vh] content-start gap-2.5 max-[769px]:min-h-[110px]">
          {todos.map((todo) => <BoardTodoCard key={todo.id} todo={todo} onStatusChange={onStatusChange} />)}
          {todos.length === 0 && <p className="grid min-h-[104px] place-items-center rounded-lg border border-dashed border-kanbot-line-strong bg-kanbot-white-soft-1 text-xs text-kanbot-subtle">{t("Drop a task here")}</p>}
        </div>
      </SortableContext>
    </section>
  );
}
