import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateProjectRequest, UpdateProjectRequest } from "@shared/types/api";
import { queryKeys } from "@shared/api/queryKeys";
import { createProject, deleteProject, listProjects, updateProject } from "../api/projects";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: listProjects,
  });
}

export function useSaveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId?: string; body: CreateProjectRequest | UpdateProjectRequest }) =>
      projectId
        ? updateProject(projectId, body as UpdateProjectRequest)
        : createProject(body as CreateProjectRequest),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}
