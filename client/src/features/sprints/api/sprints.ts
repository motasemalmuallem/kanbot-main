import { apiRequest } from "@shared/api/client";
import type {
  CompleteSprintRequest,
  CreateSprintRequest,
  StartSprintRequest,
  Sprint,
  SprintBoardResponse,
  UpdateSprintRequest,
} from "@shared/types/api";
export const listSprints = (projectId: string) =>
  apiRequest<{ sprints: Sprint[] }>(`/projects/${projectId}/sprints`);
export const createSprint = (projectId: string, body: CreateSprintRequest) =>
  apiRequest<{ sprint: Sprint }>(`/projects/${projectId}/sprints`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const getSprintBoard = (id: string) =>
  apiRequest<SprintBoardResponse>(`/sprints/${id}/todos`);
export const updateSprint = (id: string, body: UpdateSprintRequest) =>
  apiRequest<{ sprint: Sprint }>(`/sprints/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const startSprint = (id: string, body: StartSprintRequest = {}) =>
  apiRequest<{ sprint: Sprint }>(`/sprints/${id}/start`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const completeSprint = (id: string, body: CompleteSprintRequest) =>
  apiRequest<{ sprint: Sprint }>(`/sprints/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const deleteSprint = (id: string) =>
  apiRequest<void>(`/sprints/${id}`, { method: "DELETE" });
