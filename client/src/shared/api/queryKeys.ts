import type { TodoListQuery } from "@shared/types/api";

/** Central query-key factory keeps feature caches consistent and easy to invalidate. */
export const queryKeys = {
  projects: ["projects"] as const,
  project: (projectId: string) => ["project", projectId] as const,
  todos: (projectId: string, filters: TodoListQuery = {}) =>
    ["todos", projectId, filters] as const,
  todoLists: (projectId: string) => ["todos", projectId] as const,
  sprints: (projectId: string) => ["sprints", projectId] as const,
  board: (sprintId: string) => ["board", sprintId] as const,
  aiStatus: ["ai-status"] as const,
};
