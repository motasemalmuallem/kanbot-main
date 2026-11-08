import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

export function TodoDropZone({
  id,
  sprintId,
  as = "section",
  className,
  children,
}: {
  id: string;
  sprintId: string | null;
  as?: "section" | "div";
  className: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { sprintId } });
  const Component = as;
  return (
    <Component ref={setNodeRef} className={`${className} ${isOver ? "ring-2 ring-inset ring-kanbot-accent/70 shadow-[inset_0_0_0_1px_rgb(129_123_255_/_35%)]" : ""}`}>
      {children}
    </Component>
  );
}
