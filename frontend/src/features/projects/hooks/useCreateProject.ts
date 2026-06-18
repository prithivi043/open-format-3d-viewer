import { useMutation } from "@tanstack/react-query";
import { createProject } from "../api/projectApi";

export function useCreateProject() {
  return useMutation({
    mutationFn: createProject,
  });
}
