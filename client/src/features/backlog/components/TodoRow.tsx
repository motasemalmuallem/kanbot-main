import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpToLine, FolderKanban, Inbox, MoreHorizontal } from "lucide-react";
import type { Sprint, Todo } from "@shared/types/api";
import { AssigneeAvatar, PriorityBadge, Tooltip, TypeIcon } from "@shared/components/ui";
import { useLanguage } from "@shared/i18n/LanguageProvider";

interface TodoRowProps {
  todo: Todo;
  sprints: Sprint[];
  onOpen: (todo: Todo) => void;
  onMove: (todoId: string, sprintId: string | null, position: number) => void;
  animationDelayMs?: number;
}

export function TodoRow({
  todo,
  sprints,
  onOpen,
  onMove,
  animationDelayMs = 0,
}: TodoRowProps) {
  const { t, isArabic, formatNumber } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dragStartedRef = useRef(false);
  const { active, attributes, listeners, over, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: todo.id,
    data: { sprintId: todo.sprintId, status: todo.status },
  });
  const activeRect = active?.rect.current.translated;
  const isDropTarget = isOver && active?.id !== todo.id;
  const insertAfterTarget = Boolean(
    isDropTarget &&
      activeRect &&
      over &&
      activeRect.top + activeRect.height / 2 > over.rect.top + over.rect.height / 2,
  );
  const handlePointerDown = listeners?.onPointerDown as React.PointerEventHandler<HTMLDivElement> | undefined;
  const handleKeyDown = listeners?.onKeyDown as React.KeyboardEventHandler<HTMLButtonElement> | undefined;
  const dragHandleProps = {
    ...attributes,
    ...(handleKeyDown ? { onKeyDown: handleKeyDown } : {}),
  };
  useLayoutEffect(() => {
    if (isDragging) dragStartedRef.current = true;
  }, [isDragging]);
  const plannedSprints = sprints.filter(
    (sprint) => sprint.status === "planned" && sprint.id !== todo.sprintId,
  );
  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      )
        setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!menuOpen) return;

    const updateMenuPosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const triggerRect = trigger.getBoundingClientRect();
      if (triggerRect.bottom < 0 || triggerRect.top > window.innerHeight) {
        setMenuOpen(false);
        return;
      }

      const menuRect = menu.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 8;
      const belowTop = triggerRect.bottom + gap;
      const aboveTop = triggerRect.top - menuRect.height - gap;
      const top =
        belowTop + menuRect.height <= window.innerHeight - viewportPadding
          ? belowTop
          : aboveTop >= viewportPadding
            ? aboveTop
            : Math.max(viewportPadding, window.innerHeight - menuRect.height - viewportPadding);
      const maxLeft = Math.max(
        viewportPadding,
        window.innerWidth - menuRect.width - viewportPadding,
      );
      const left = Math.min(
        maxLeft,
        Math.max(viewportPadding, triggerRect.right - menuRect.width),
      );

      setMenuPosition((current) => {
        if (current && current.top === top && current.left === left) return current;
        return { top, left };
      });
    };

    updateMenuPosition();
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [menuOpen]);

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.max(12, rect.right - 224),
    });
    setMenuOpen((open) => !open);
  };
  const moveAndClose = (sprintId: string | null, position: number) => {
    onMove(todo.id, sprintId, position);
    setMenuOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`grid min-h-[58px] min-w-[980px] cursor-grab grid-cols-[24px_72px_minmax(190px,2fr)_minmax(145px,1.25fr)_82px_112px_72px_22px] items-center gap-3 border-t border-kanbot-line bg-kanbot-panel px-4 text-xs text-kanbot-zinc-300 transition-colors hover:bg-kanbot-hover active:cursor-grabbing motion-safe:animate-kanbot-row-enter motion-reduce:animate-none max-[1320px]:mb-2 max-[1320px]:min-h-0 max-[1320px]:min-w-0 max-[1320px]:grid-cols-[24px_minmax(0,1fr)_auto] max-[1320px]:grid-rows-[auto_auto_auto_auto] max-[1320px]:items-start max-[1320px]:gap-x-2 max-[1320px]:gap-y-1.5 max-[1320px]:rounded-lg max-[1320px]:border max-[1320px]:border-t max-[1320px]:px-3 max-[1320px]:py-2.5 ${isDragging ? "relative z-20 cursor-grabbing bg-kanbot-raised shadow-xl ring-2 ring-inset ring-kanbot-accent/80" : ""} ${isDropTarget ? "relative z-10 bg-kanbot-violet-soft-strong ring-1 ring-inset ring-kanbot-accent/60" : ""}`}
      style={{ animationDelay: `${animationDelayMs}ms`, transform: CSS.Transform.toString(transform), transition }}
      role="group"
      onPointerDown={(event) => {
        dragStartedRef.current = false;
        if (event.target instanceof Element && event.target.closest("[data-no-drag]")) return;
        handlePointerDown?.(event);
      }}
      onClick={() => {
        if (dragStartedRef.current) {
          dragStartedRef.current = false;
          return;
        }
        onOpen(todo);
      }}
    >
      {isDropTarget && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 z-30 h-[3px] rounded-full bg-kanbot-accent shadow-[0_0_10px_rgb(129_123_255_/_85%)] ${insertAfterTarget ? "bottom-0" : "top-0"}`}
        />
      )}
      <button ref={setActivatorNodeRef} type="button" className={`cursor-grab touch-none bg-transparent p-0 active:cursor-grabbing max-[1320px]:col-start-1 max-[1320px]:row-start-1 max-[1320px]:mt-0.5 ${isDragging ? "text-kanbot-accent" : "text-kanbot-muted"}`} aria-label={`${t("Reorder")} ${todo.key}`} {...dragHandleProps} onClick={(event) => event.stopPropagation()}>
        ⠿
      </button>
      <span className="justify-self-center truncate text-center text-kanbot-muted max-[1320px]:col-start-2 max-[1320px]:row-start-1 max-[1320px]:justify-self-start">{todo.key}</span>
      <Tooltip content={`${t("More actions for")} ${todo.key}`} className="max-[1320px]:col-start-2 max-[1320px]:row-start-2 max-[1320px]:w-full max-[1320px]:min-w-0">
      <button
        className="w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap bg-transparent p-0 text-center font-medium text-kanbot-ink hover:bg-transparent hover:text-kanbot-accent hover:underline max-[1320px]:line-clamp-2 max-[1320px]:whitespace-normal max-[1320px]:text-start"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (dragStartedRef.current) {
            dragStartedRef.current = false;
            return;
          }
          onOpen(todo);
        }}
      >
        {todo.title}
      </button>
      </Tooltip>
      <span className="inline-flex w-[145px] max-w-full min-w-0 items-center justify-self-center gap-2 text-xs text-kanbot-zinc-400 max-[1320px]:col-start-2 max-[1320px]:row-start-3 max-[1320px]:w-auto max-[1320px]:justify-self-start">
        <AssigneeAvatar name={todo.assigneeName} />
        <span className="min-w-0 flex-1 truncate">
          {t(todo.assigneeName ?? "Unassigned")}
        </span>
      </span>
      <div className="contents max-[1320px]:col-start-2 max-[1320px]:row-start-4 max-[1320px]:flex max-[1320px]:flex-wrap max-[1320px]:items-center max-[1320px]:gap-2">
      <span className="inline-flex min-w-0 items-center justify-self-center gap-1.5 text-[11px] text-kanbot-muted">
        <TypeIcon type={todo.type} />
        <span>{t(todo.type)}</span>
      </span>
      <span className="justify-self-center">
        <PriorityBadge priority={todo.priority} />
      </span>
      <span className="justify-self-center whitespace-nowrap rounded-md border border-kanbot-line bg-kanbot-raised px-2 py-1 text-[11px] text-kanbot-zinc-300">{todo.storyPoints === null ? "—" : formatNumber(todo.storyPoints)} {t("pts")}</span>
      </div>
      <button
        ref={triggerRef}
        className="grid size-8 place-items-center rounded-md bg-transparent p-0 text-kanbot-muted hover:bg-kanbot-hover hover:text-kanbot-ink max-[1320px]:col-start-3 max-[1320px]:row-start-1 max-[1320px]:self-start"
        type="button"
        data-no-drag
        aria-label={`${t("Actions for")} ${todo.key}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={toggleMenu}
      >
        <MoreHorizontal size={17} aria-hidden="true" />
      </button>
      {menuOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] grid max-h-[calc(100vh-1.5rem)] w-56 gap-1.5 overflow-y-auto overscroll-contain rounded-xl border border-kanbot-line-strong bg-kanbot-context p-2 shadow-2xl shadow-black/25 ring-1 ring-kanbot-line/70"
            role="menu"
            dir={isArabic ? "rtl" : "ltr"}
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-kanbot-line-strong bg-kanbot-panel px-2.5 py-2 text-start text-sm font-semibold text-kanbot-ink shadow-sm transition duration-150 hover:border-kanbot-accent/50 hover:bg-kanbot-hover hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kanbot-accent/70"
              onClick={() => moveAndClose(todo.sprintId, 0)}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-kanbot-accent/10 text-kanbot-accent">
                <ArrowUpToLine size={16} aria-hidden="true" />
              </span>
              <span>{t("Move to top")}</span>
            </button>
            {todo.sprintId !== null && (
              <button
                type="button"
                role="menuitem"
                className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-kanbot-line-strong bg-kanbot-panel px-2.5 py-2 text-start text-sm font-semibold text-kanbot-ink shadow-sm transition duration-150 hover:border-kanbot-accent/50 hover:bg-kanbot-hover hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kanbot-accent/70"
                onClick={() => moveAndClose(null, 0)}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-kanbot-raised text-kanbot-muted">
                  <Inbox size={16} aria-hidden="true" />
                </span>
                <span>{t("Move to backlog")}</span>
              </button>
            )}
            {plannedSprints.length > 0 && (
              <div className="mt-1 border-t border-kanbot-line px-2.5 pb-1 pt-2 text-[10px] font-semibold tracking-wide text-kanbot-subtle">
                {t("Move to sprint")}
              </div>
            )}
            {plannedSprints.map((sprint) => (
              <button
                type="button"
                role="menuitem"
                key={sprint.id}
                className="flex min-h-11 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border border-kanbot-line-strong bg-kanbot-panel px-2.5 py-2 text-start text-sm font-semibold text-kanbot-ink shadow-sm transition duration-150 hover:border-kanbot-accent/50 hover:bg-kanbot-hover hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kanbot-accent/70"
                onClick={() => moveAndClose(sprint.id, Number.MAX_SAFE_INTEGER)}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-kanbot-raised text-kanbot-accent">
                  <FolderKanban size={16} aria-hidden="true" />
                </span>
                <span className="truncate">{sprint.name}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
