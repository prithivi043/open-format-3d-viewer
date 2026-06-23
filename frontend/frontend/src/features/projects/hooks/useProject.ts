import { useQuery } from "@tanstack/react-query";
import { getProject } from "../api/projectApi";
import type { Project } from "../types/project.types";

export function useProject(projectId: string) {
  return useQuery<Project, Error>({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 5,
  });
}
