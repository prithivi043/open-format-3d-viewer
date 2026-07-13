import { useQueries } from "@tanstack/react-query";
import { getProjectModels } from "../api/modelApi";
import type { Model } from "../types/model.types";

export interface ProjectModelSummary {
  projectId: string;
  modelCount: number;
  latestModelDate: string | null; // ISO string of most recent model created_at
  isLoading: boolean;
}

/**
 * Fetches models for every provided project ID in parallel and returns
 * a per-project summary (model count + latest upload date).
 *
 * This is necessary because the backend ProjectResponse never includes
 * model_count or any model-related aggregates.
 */
export function useProjectModelSummaries(
  projectIds: string[],
): Map<string, ProjectModelSummary> {
  const results = useQueries({
    queries: projectIds.map((id) => ({
      queryKey: ["project-models", id],
      queryFn: () => getProjectModels(id),
      enabled: Boolean(id),
      staleTime: 0,
      refetchOnMount: true,
    })),
  });

  const map = new Map<string, ProjectModelSummary>();

  projectIds.forEach((id, i) => {
    const result = results[i];
    const models: Model[] = result?.data ?? [];

    // Find the most recent model by created_at
    let latestModelDate: string | null = null;
    for (const m of models) {
      if (!latestModelDate || m.created_at > latestModelDate) {
        latestModelDate = m.created_at;
      }
    }

    map.set(id, {
      projectId: id,
      modelCount: models.length,
      latestModelDate,
      isLoading: result?.isLoading ?? false,
    });
  });

  return map;
}
