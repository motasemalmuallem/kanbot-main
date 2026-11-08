import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChatMessage } from "@shared/types/api";
import { queryKeys } from "@shared/api/queryKeys";
import { chat, getAiStatus, generateTodos, planSprint, summarizeSprint } from "../api/ai";

export function useAiStatus() {
  return useQuery({ queryKey: queryKeys.aiStatus, queryFn: getAiStatus, staleTime: 60_000 });
}

export function useAiActions(projectId: string) {
  const queryClient = useQueryClient();
  return {
    generateTodos: useMutation({ mutationFn: ({ prompt, count }: { prompt: string; count: number }) => generateTodos(projectId, prompt, count) }),
    planSprint: useMutation({ mutationFn: ({ capacity, focus }: { capacity: number; focus?: string }) => planSprint(projectId, capacity, focus) }),
    chat: useMutation({ mutationFn: (messages: ChatMessage[]) => chat(projectId, messages) }),
    summarizeSprint: useMutation({
      mutationFn: summarizeSprint,
      onSuccess: async (result) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.sprints(result.sprint.projectId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.board(result.sprint.id) }),
        ]);
      },
    }),
  };
}
