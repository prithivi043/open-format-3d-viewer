import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUploadStore } from "../store/uploadStore";
import { uploadModel } from "../../../lib/modelUploadService";

export function useUploadModel(projectId: string) {
  const qc = useQueryClient();
  const { setProgress, setUploading, reset } = useUploadStore();

  return useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      setProgress(0);

      const result = await uploadModel({
        projectId,
        file,
        onProgress: (pct) => {
          setProgress(pct);
        },
      });

      return result.modelId;
    },

    onSuccess: () => {
      // Refresh the models table and project stats immediately after upload
      qc.invalidateQueries({ queryKey: ["project-models", projectId] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },

    onError: (error) => {
      console.error("Upload mutation error:", error);
    },

    onSettled: () => {
      setUploading(false);
      reset();
    },
  });
}

