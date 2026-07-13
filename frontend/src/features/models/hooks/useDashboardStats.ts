import { useQueries } from "@tanstack/react-query";
import { getProjectModels } from "../api/modelApi";
import type { Model } from "../types/model.types";

interface DashboardStats {
  totalModels: number;
  totalStorageBytes: number;
  /** Whether any per-project model query is still loading */
  isLoading: boolean;
  /** Whether all per-project model queries have settled */
  isSettled: boolean;
}

/**
 * Aggregates model count and total storage across all projects by fetching
 * each project's model list in parallel.
 *
 * The backend's GET /v1/projects endpoint does NOT return model_count or
 * storage_bytes in its response, so we must derive these from the actual
 * model records to show accurate dashboard metrics.
 *
 * @param projectIds - array of project IDs returned by useProjects()
 */
export function useDashboardStats(projectIds: string[]): DashboardStats {
  const results = useQueries({
    queries: projectIds.map((id) => ({
      queryKey: ["project-models", id],
      queryFn: () => getProjectModels(id),
      enabled: Boolean(id),
      staleTime: 0,
      refetchOnMount: true,
    })),
  });

  let totalModels = 0;
  let totalStorageBytes = 0;
  let isLoading = false;
  let allSettled = true;

  for (const result of results) {
    if (result.isLoading || result.isFetching) isLoading = true;
    if (!result.isSuccess && !result.isError) allSettled = false;

    const models: Model[] = result.data ?? [];
    totalModels += models.length;
    totalStorageBytes += models.reduce((sum, m) => sum + (m.size_bytes ?? 0), 0);
  }

  // When there are no projects yet all queries are trivially settled
  if (projectIds.length === 0) allSettled = true;

  return {
    totalModels,
    totalStorageBytes,
    isLoading: projectIds.length > 0 && isLoading,
    isSettled: allSettled,
  };
}
