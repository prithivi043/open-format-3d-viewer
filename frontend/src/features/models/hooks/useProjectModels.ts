import { useQuery } from "@tanstack/react-query";
import { getProjectModels } from "../api/modelApi";
import type { Model } from "../types/model.types";

export function useProjectModels(projectId: string) {
  return useQuery<Model[], Error>({
    queryKey: ["project-models", projectId],
    queryFn: () => getProjectModels(projectId),
    enabled: Boolean(projectId),
    staleTime: 0,          // always fresh – reflects uploads immediately
    refetchOnMount: true,
  });
}
