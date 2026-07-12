import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteProjectMember, removeProjectMember } from "../api/projectApi";
import type { InviteMemberPayload } from "../types/project.types";

export function useInviteMember(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteMemberPayload) =>
      inviteProjectMember(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeProjectMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}
