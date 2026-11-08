import { BookOpen, Bug, CheckSquare2 } from "lucide-react";
import type { TodoType } from "@shared/types/api";

const icons = {
  task: CheckSquare2,
  story: BookOpen,
  bug: Bug,
} satisfies Record<TodoType, typeof CheckSquare2>;

export function TypeIcon({
  type,
  size = 15,
}: {
  type: TodoType;
  size?: number;
}) {
  const Icon = icons[type];
  const color =
    type === "story"
      ? "text-kanbot-sky-300"
      : type === "bug"
        ? "text-kanbot-rose-300"
        : "text-kanbot-muted";
  return <Icon className={color} size={size} aria-hidden="true" />;
}
