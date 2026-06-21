import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "../api/projectApi";
import type { Project, CreateProjectPayload } from "../types/project.types";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, CreateProjectPayload>({
    mutationFn: createProject,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
