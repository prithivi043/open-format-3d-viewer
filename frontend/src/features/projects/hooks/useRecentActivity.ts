import { useQuery, useQueries } from "@tanstack/react-query";
import { getProjects, getProjectMembers } from "../api/projectApi";
import { getProjectModels } from "../../models/api/modelApi";
import type { Project } from "../types/project.types";
import type { Model } from "../../models/types/model.types";
import type { ProjectMemberDetail } from "../types/project.types";
import { useState, useEffect, useMemo } from "react";

export interface ActivityFeedItem {
  id: string;
  file: string;
  action: string;
  time: string;
  timestamp: string;
  dotColor: string;
}

const ACTIVITY_COLORS = {
  projectCreated: "#534AB7", // Purple
  projectUpdated: "#378ADD", // Blue
  modelUploaded: "#1D9E75",  // Green
  memberJoined: "#BA7517",   // Gold/Yellow
};

export function useRecentActivity() {
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

  // 1) Fetch all projects
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: getProjects,
    staleTime: 1000 * 30,
    refetchInterval: 30000, // Poll projects list every 30s
    refetchIntervalInBackground: false,
  });

  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);

  // 2) Fetch models for all projects in parallel
  const modelQueries = useQueries({
    queries: projectIds.map((id) => ({
      queryKey: ["project-models", id],
      queryFn: () => getProjectModels(id),
      enabled: Boolean(id),
      staleTime: 1000 * 30,
      refetchInterval: 30000,
      refetchIntervalInBackground: false,
    })),
  });

  // 3) Fetch members for all projects in parallel
  const memberQueries = useQueries({
    queries: projectIds.map((id) => ({
      queryKey: ["project-members", id],
      queryFn: () => getProjectMembers(id),
      enabled: Boolean(id),
      staleTime: 1000 * 30,
      refetchInterval: 30000,
      refetchIntervalInBackground: false,
    })),
  });

  const modelsLoading = modelQueries.some((q) => q.isLoading);
  const membersLoading = memberQueries.some((q) => q.isLoading);
  const isLoading = projectsLoading || modelsLoading || membersLoading;

  const error = projectsError || 
    modelQueries.find((q) => q.error)?.error as Error || 
    memberQueries.find((q) => q.error)?.error as Error || 
    null;

  // 4) Compile the activity timeline dynamically from real-time data
  const activity: ActivityFeedItem[] = useMemo(() => {
    if (projects.length === 0) return [];

    const events: {
      id: string;
      file: string;
      action: string;
      timestamp: string;
      dotColor: string;
    }[] = [];

    projects.forEach((proj, idx) => {
      // Event: Project Created
      events.push({
        id: `proj-create-${proj.id}`,
        file: proj.name,
        action: "Project created",
        timestamp: proj.createdAt,
        dotColor: ACTIVITY_COLORS.projectCreated,
      });

      // Event: Project Updated (if different from creation time)
      if (proj.updatedAt && proj.updatedAt !== proj.createdAt) {
        events.push({
          id: `proj-update-${proj.id}`,
          file: proj.name,
          action: "Project settings updated",
          timestamp: proj.updatedAt,
          dotColor: ACTIVITY_COLORS.projectUpdated,
        });
      }

      // Event: Models Uploaded
      const models: Model[] = modelQueries[idx]?.data ?? [];
      models.forEach((m) => {
        events.push({
          id: `model-upload-${m.id}`,
          file: m.filename,
          action: `Uploaded to project "${proj.name}"`,
          timestamp: m.created_at,
          dotColor: ACTIVITY_COLORS.modelUploaded,
        });
      });

      // Event: Collaborator Invited / Joined
      const members: ProjectMemberDetail[] = memberQueries[idx]?.data ?? [];
      members.forEach((mem) => {
        // Skip adding the creator/owner as a join event if it's the project creation time
        // (to keep the feed focused on subsequent invites/collaboration updates)
        const isOwnerJoin = mem.role === "admin" && 
          Math.abs(new Date(mem.joinedAt).getTime() - new Date(proj.createdAt).getTime()) < 5000;

        if (!isOwnerJoin) {
          events.push({
            id: `member-join-${proj.id}-${mem.id}`,
            file: mem.fullName,
            action: `Joined "${proj.name}" as ${mem.role}`,
            timestamp: mem.joinedAt,
            dotColor: ACTIVITY_COLORS.memberJoined,
          });
        }
      });
    });

    // Helper to format timestamps dynamically
    const formatTimeAgo = (isoString: string): string => {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "—";
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60_000);
      if (diffMin < 1) return "just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString();
    };

    // Sort all events across all projects descending by timestamp, and select top 5
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map((ev) => ({
        ...ev,
        time: formatTimeAgo(ev.timestamp),
      }));
  }, [projects, modelQueries, memberQueries]);

  return {
    activity,
    isLoading,
    error,
    isOffline,
  };
}
