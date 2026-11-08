import { apiRequest } from "@shared/api/client";
import type {
  ChatMessage,
  ChatResponse,
  AiStatusResponse,
  GenerateTodosResponse,
  PlanSprintResponse,
  SprintSummaryResponse,
} from "@shared/types/api";
export const getAiStatus = () => apiRequest<AiStatusResponse>("/ai/status");
export const generateTodos = (projectId: string, prompt: string, count = 5) =>
  apiRequest<GenerateTodosResponse>(
    `/projects/${projectId}/ai/generate-todos`,
    { method: "POST", body: JSON.stringify({ prompt, count }) },
  );
export const planSprint = (
  projectId: string,
  capacity: number,
  focus?: string,
) =>
  apiRequest<PlanSprintResponse>(`/projects/${projectId}/ai/plan-sprint`, {
    method: "POST",
    body: JSON.stringify({ capacity, focus }),
  });
export const chat = (projectId: string, messages: ChatMessage[]) =>
  apiRequest<ChatResponse>(`/projects/${projectId}/ai/chat`, {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
export const summarizeSprint = (sprintId: string) =>
  apiRequest<SprintSummaryResponse>(`/sprints/${sprintId}/ai/summary`, {
    method: "POST",
    body: "{}",
  });
