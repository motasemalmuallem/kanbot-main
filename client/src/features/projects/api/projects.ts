import { apiRequest } from "@shared/api/client";
import type {
  CreateProjectRequest,
  ProjectWithStats,
  UpdateProjectRequest,
} from "@shared/types/api";
export const listProjects = () =>
  apiRequest<{ projects: ProjectWithStats[] }>("/projects");
export const createProject = (body: CreateProjectRequest) =>
  apiRequest<{ project: ProjectWithStats }>("/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateProject = (projectId: string, body: UpdateProjectRequest) =>
  apiRequest<{ project: ProjectWithStats }>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteProject = (projectId: string) =>
  apiRequest<void>(`/projects/${projectId}`, { method: "DELETE" });
