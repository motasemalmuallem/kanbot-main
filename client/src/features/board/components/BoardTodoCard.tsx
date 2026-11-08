import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { AssigneeAvatar, PriorityBadge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, TypeIcon } from "@shared/components/ui";
import type { Todo, TodoStatus } from "@shared/types/api";
import { useLanguage } from "@shared/i18n/LanguageProvider";

const statuses: { status: TodoStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review", label: "In Review" },
  { status: "done", label: "Done" },
];

type BoardTodoCardProps = {
  todo: Todo;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
};

export function BoardTodoCard({ todo, onStatusChange }: BoardTodoCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    data: { status: todo.status },
  });
  const handlePointerDown = listeners?.onPointerDown as React.PointerEventHandler<HTMLElement> | undefined;
  const handleKeyDown = listeners?.onKeyDown as React.KeyboardEventHandler<HTMLButtonElement> | undefined;
  const dragHandleProps = {
    ...attributes,
    ...(handleKeyDown ? { onKeyDown: handleKeyDown } : {}),
  };

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      onPointerDown={(event) => {
        if (event.target instanceof Element && event.target.closest("[data-no-drag]")) return;
        handlePointerDown?.(event);
      }}
      className={`group grid min-w-0 cursor-grab gap-3 rounded-xl border border-kanbot-line bg-gradient-to-br from-kanbot-raised to-kanbot-card-gradient-end p-3.5 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-kanbot-line-strong hover:shadow-md ${isDragging ? "cursor-grabbing" : ""}`}
    >
      <BoardTodoCardContent
        todo={todo}
        onStatusChange={onStatusChange}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={dragHandleProps}
      />
    </article>
  );
}

export function BoardTodoCardPreview({ todo }: { todo: Todo }) {
  return (
    <article className="pointer-events-none grid min-w-0 gap-3 rounded-xl border border-kanbot-accent/60 bg-gradient-to-br from-kanbot-raised to-kanbot-card-gradient-end p-3.5 shadow-xl ring-1 ring-kanbot-accent/30">
      <BoardTodoCardContent todo={todo} />
    </article>
  );
}

function BoardTodoCardContent({
  todo,
  onStatusChange,
  dragHandleRef,
  dragHandleProps,
}: {
  todo: Todo;
  onStatusChange?: (todoId: string, status: TodoStatus) => void;
  dragHandleRef?: (element: HTMLElement | null) => void;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { t } = useLanguage();
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md border border-kanbot-line bg-kanbot-panel px-1.5 py-1 text-[10px] font-semibold tracking-wide text-kanbot-muted">{todo.key}</span>
        {dragHandleProps ? (
          <button
            ref={dragHandleRef}
            type="button"
            {...dragHandleProps}
            className="grid size-7 shrink-0 touch-none cursor-grab select-none place-items-center rounded-md text-kanbot-muted transition hover:bg-kanbot-hover hover:text-kanbot-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kanbot-accent active:cursor-grabbing"
            aria-label={t("Move task")}
          >
            <GripVertical size={16} aria-hidden="true" />
          </button>
        ) : <GripVertical className="shrink-0 text-kanbot-muted" size={16} aria-hidden="true" />}
      </div>
      <strong className="min-h-10 break-words text-[13px] font-semibold leading-relaxed text-kanbot-ink">{todo.title}</strong>
      <footer className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] text-kanbot-muted">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-kanbot-line bg-kanbot-panel px-2 py-1"><TypeIcon type={todo.type} />{t(todo.type)}</span>
        <PriorityBadge priority={todo.priority} />
        <span className="ms-auto whitespace-nowrap rounded-md border border-kanbot-line bg-kanbot-panel px-2 py-1 font-medium text-kanbot-zinc-300">{todo.storyPoints ?? "—"} {t("pts")}</span>
      </footer>
      {onStatusChange && (
        <div data-no-drag className="flex min-w-0 items-center gap-2 rounded-lg border border-kanbot-line bg-kanbot-panel/80 px-2.5 py-2">
          <span className="shrink-0 text-[10px] font-medium text-kanbot-muted">{t("Status")}</span>
          <Select value={todo.status} onValueChange={(value) => {
            const nextStatus = statuses.find((item) => item.status === value)?.status;
            if (nextStatus && nextStatus !== todo.status) onStatusChange(todo.id, nextStatus);
          }}>
            <SelectTrigger className="!min-h-8 !min-w-0 !flex-1 !rounded-md !bg-kanbot-raised !px-2 !text-[11px]" aria-label={`${t("Status")} · ${todo.key}`}>
              <SelectValue>{t(statuses.find(({ status }) => status === todo.status)?.label ?? todo.status)}</SelectValue>
            </SelectTrigger>
            <SelectContent>{statuses.map(({ status, label }) => <SelectItem key={status} value={status}>{t(label)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="flex min-w-0 items-center gap-2.5 border-t border-kanbot-line pt-2.5 text-xs text-kanbot-muted">
        <AssigneeAvatar name={todo.assigneeName} />
        <span className="truncate">{t(todo.assigneeName ?? "Unassigned")}</span>
      </div>
    </>
  );
}
