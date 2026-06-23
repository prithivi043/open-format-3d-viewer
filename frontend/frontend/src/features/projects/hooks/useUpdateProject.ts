import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject } from "../api/projectApi";
import type { Project, UpdateProjectPayload } from "../types/project.types";

type UpdateProjectInput = {
  projectId: string;
  data: UpdateProjectPayload;
};

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, UpdateProjectInput>({
    mutationFn: ({ projectId, data }) => updateProject(projectId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });

      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },

    onError: (error) => {
      console.error("Update project failed:", error);
    },
  });
}
