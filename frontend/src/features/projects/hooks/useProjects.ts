import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../api/projectApi";
import type { Project } from "../types/project.types";

export function useProjects() {
  return useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: getProjects,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
