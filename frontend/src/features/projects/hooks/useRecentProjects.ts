import { useQuery, useQueries } from "@tanstack/react-query";
import { getProjects } from "../api/projectApi";
import { getProjectModels } from "../../models/api/modelApi";
import { getProjectMembers } from "../api/projectApi";
import type { Project } from "../types/project.types";
import type { Model } from "../../models/types/model.types";
import { useState, useEffect, useMemo } from "react";

/**
 * Returns the top-4 most-recently-updated projects, enriched with LIVE
 * model counts and member counts fetched in parallel — because the
 * backend's GET /v1/projects list does NOT include model_count or
 * member_count, causing cards to always show "No models yet".
 *
 * All queries poll every 5 s so the cards update instantly without
 * a page refresh when a model is uploaded or a member is invited.
 */
export function useRecentProjects() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── 1) Fetch all projects ──────────────────────────────────────────────
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error,
  } = useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: getProjects,
    staleTime: 1000 * 30,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  // Sort + slice to top 4 before firing sub-queries (avoid N+1 for all projects)
  const recentSorted = useMemo(
    () =>
      [...projects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt ?? b.createdAt).getTime() -
            new Date(a.updatedAt ?? a.createdAt).getTime(),
        )
        .slice(0, 4),
    [projects],
  );

  const recentIds = useMemo(() => recentSorted.map((p) => p.id), [recentSorted]);

  // ── 2) Fetch models for the top-4 projects in parallel ────────────────
  const modelQueries = useQueries({
    queries: recentIds.map((id) => ({
      queryKey: ["project-models", id],
      queryFn: () => getProjectModels(id),
      enabled: Boolean(id),
      staleTime: 1000 * 30,
      refetchInterval: 5000,
    })),
  });

  // ── 3) Fetch members for the top-4 projects in parallel ───────────────
  const memberQueries = useQueries({
    queries: recentIds.map((id) => ({
      queryKey: ["project-members", id],
      queryFn: () => getProjectMembers(id),
      enabled: Boolean(id),
      staleTime: 1000 * 30,
      refetchInterval: 5000,
      retry: 0,
      throwOnError: false,
    })),
  });

  // ── 4) Merge live counts back onto each project ────────────────────────
  const recentProjects: Project[] = useMemo(
    () =>
      recentSorted.map((p, i) => {
        const models: Model[] = modelQueries[i]?.data ?? [];
        const members = memberQueries[i]?.data ?? [];

        // Derive the most-recent activity timestamp: take the latest of
        // the project's own updatedAt and each uploaded model's created_at.
        // This ensures the "Updated X ago" label stays accurate even if
        // the backend doesn't bump project.updated_at on model upload.
        const latestTimestamp = models.length > 0
          ? [
              p.updatedAt ?? p.createdAt,
              ...models.map((m) => m.created_at),
            ]
              .filter(Boolean)
              .sort()
              .at(-1)
          : undefined;

        return {
          ...p,
          modelCount: models.length,
          memberCount: members.length > 0 ? members.length : (p.memberCount ?? 1),
          // Only override updatedAt when we actually have a newer timestamp
          ...(latestTimestamp ? { updatedAt: latestTimestamp } : {}),
        };
      }),
    [recentSorted, modelQueries, memberQueries],
  );

  const isLoading =
    projectsLoading ||
    modelQueries.some((q) => q.isLoading) ||
    memberQueries.some((q) => q.isLoading);

  return {
    projects,          // full unsliced list — for stat cards / quick-upload
    recentProjects,    // top-4 enriched with live modelCount & memberCount
    isLoading,
    error,
    isOffline,
  };
}
