import { useQuery } from "@tanstack/react-query";
import { getModels } from "../api/modelApi";

export function useModels(projectId: string) {
  return useQuery({
    queryKey: ["models", projectId],
    queryFn: () => getModels(projectId),
    enabled: !!projectId,
  });
}
