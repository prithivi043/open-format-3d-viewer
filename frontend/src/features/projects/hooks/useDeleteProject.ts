import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProject } from "../api/projectApi";

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteProject,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },

    onError: (error) => {
      console.error("Delete project failed:", error);
    },
  });
}
