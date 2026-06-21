import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmUpload,
  requestUploadUrl,
  uploadFileToS3,
} from "../api/modelApi";
import { useUploadStore } from "../store/uploadStore";
import type { ModelFormat } from "../types/model.types";

export function useUploadModel(projectId: string) {
  const queryClient = useQueryClient();
  const { setProgress, setUploading, reset } = useUploadStore();

  return useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      setProgress(0);

      const format = file.name.split(".").pop()?.toLowerCase() as ModelFormat;

      const uploadData = await requestUploadUrl({
        project_id: projectId,
        name: file.name,
        format,
        file_size_bytes: file.size,
      });

      await uploadFileToS3(uploadData.upload_url, file, setProgress);

      await confirmUpload(uploadData.model_id);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["models", projectId],
      });
      reset();
    },

    onError: () => {
      reset();
    },
  });
}
