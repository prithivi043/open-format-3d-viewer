import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteModel } from "../api/modelApi";

export function useDeleteModel(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (modelId: string) => deleteModel(modelId),
    onSuccess: () => {
      // Refresh models list, project detail, and project list
      qc.invalidateQueries({ queryKey: ["project-models", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
