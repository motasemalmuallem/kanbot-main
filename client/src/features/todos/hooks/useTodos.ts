import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BulkCreateTodosRequest, MoveTodoRequest, TodoListQuery, UpdateTodoRequest } from "@shared/types/api";
import { queryKeys } from "@shared/api/queryKeys";
import { createTodo, createTodosBulk, deleteTodo, listTodos, moveTodo, updateTodo } from "../api/todos";

export function useTodos(projectId: string, filters: TodoListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.todos(projectId, filters),
    queryFn: () => listTodos(projectId, filters),
    enabled: Boolean(projectId),
  });
}

export function useTodoMutations(projectId: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.todoLists(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints(projectId) }),
      queryClient.invalidateQueries({ queryKey: ["board"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
    ]);
  };
  return {
    create: useMutation({ mutationFn: (body: Parameters<typeof createTodo>[1]) => createTodo(projectId, body), onSuccess: invalidate }),
    createBulk: useMutation({ mutationFn: (body: BulkCreateTodosRequest) => createTodosBulk(projectId, body), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateTodoRequest }) => updateTodo(id, body), onSuccess: invalidate }),
    move: useMutation({ mutationFn: ({ id, body }: { id: string; body: MoveTodoRequest }) => moveTodo(id, body), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: deleteTodo, onSuccess: invalidate }),
  };
}
