import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompleteSprintRequest, CreateSprintRequest, StartSprintRequest, UpdateSprintRequest } from "@shared/types/api";
import { queryKeys } from "@shared/api/queryKeys";
import { completeSprint, createSprint, deleteSprint, getSprintBoard, listSprints, startSprint, updateSprint } from "../api/sprints";

export function useSprints(projectId: string) {
  return useQuery({ queryKey: queryKeys.sprints(projectId), queryFn: () => listSprints(projectId), enabled: Boolean(projectId) });
}

export function useSprintBoard(sprintId: string | null | undefined) {
  return useQuery({ queryKey: queryKeys.board(sprintId ?? "none"), queryFn: () => getSprintBoard(sprintId!), enabled: Boolean(sprintId) });
}

export function useSprintMutations(projectId: string) {
  const queryClient = useQueryClient();
  const invalidate = async (sprintId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.todoLists(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
      ...(sprintId ? [queryClient.invalidateQueries({ queryKey: queryKeys.board(sprintId) })] : []),
    ]);
  };
  return {
    create: useMutation({ mutationFn: (body: CreateSprintRequest) => createSprint(projectId, body), onSuccess: () => invalidate() }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateSprintRequest }) => updateSprint(id, body), onSuccess: (_data, variables) => invalidate(variables.id) }),
    start: useMutation({ mutationFn: ({ id, body }: { id: string; body?: StartSprintRequest }) => startSprint(id, body), onSuccess: (_data, variables) => invalidate(variables.id) }),
    complete: useMutation({ mutationFn: ({ id, body }: { id: string; body: CompleteSprintRequest }) => completeSprint(id, body), onSuccess: (_data, variables) => invalidate(variables.id) }),
    delete: useMutation({ mutationFn: deleteSprint, onSuccess: () => invalidate() }),
  };
}
