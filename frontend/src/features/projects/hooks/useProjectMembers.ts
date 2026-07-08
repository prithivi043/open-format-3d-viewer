import { useQuery } from "@tanstack/react-query";
import { getProjectMembers } from "../api/projectApi";
import type { ProjectMemberDetail } from "../types/project.types";

export function useProjectMembers(projectId: string) {
  return useQuery<ProjectMemberDetail[], Error>({
    queryKey: ["project-members", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: Boolean(projectId),
    staleTime: 1000 * 30, // 30 s — refresh quickly so invites reflect soon
  });
}
