import { useMutation } from "@tanstack/react-query";
import {
  confirmUpload,
  requestUploadUrl,
  uploadFileToS3,
} from "../api/modelApi";
import { useUploadStore } from "../store/uploadStore";
import { isMockModeActive } from "../../../lib/mockApi";

export function useUploadModel(projectId: string) {
  const { setProgress, setUploading, reset } = useUploadStore();

  return useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      setProgress(0);

      const uploadData = await requestUploadUrl({
        project_id: projectId,
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });

      await uploadFileToS3(uploadData.upload_url, file, setProgress);

      setProgress(100);

      try {
        await confirmUpload(uploadData.model_id);
      } catch (error) {
        if (uploadData.upload_url.startsWith("local://") || isMockModeActive()) {
          console.warn("Skipping confirmUpload failure in local/mock mode", error);
        } else {
          throw error;
        }
      }

      return uploadData.model_id;
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
