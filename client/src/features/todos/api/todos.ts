import { apiRequest } from "@shared/api/client";
import type {
  BulkCreateTodosRequest,
  MoveTodoRequest,
  Todo,
  TodoListQuery,
  UpdateTodoRequest,
} from "@shared/types/api";
export const listTodos = (projectId: string, query: TodoListQuery = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, value);
  });
  return apiRequest<{ todos: Todo[] }>(
    `/projects/${projectId}/todos${params.size ? `?${params}` : ""}`,
  );
};
export const createTodo = (
  projectId: string,
  body: Omit<BulkCreateTodosRequest["todos"][number], never>,
) =>
  apiRequest<{ todo: Todo }>(`/projects/${projectId}/todos`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const createTodosBulk = (
  projectId: string,
  body: BulkCreateTodosRequest,
) =>
  apiRequest<{ todos: Todo[] }>(`/projects/${projectId}/todos/bulk`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateTodo = (id: string, body: UpdateTodoRequest) =>
  apiRequest<{ todo: Todo }>(`/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const moveTodo = (id: string, body: MoveTodoRequest) =>
  apiRequest<{ todo: Todo }>(`/todos/${id}/move`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const deleteTodo = (id: string) =>
  apiRequest<void>(`/todos/${id}`, { method: "DELETE" });
