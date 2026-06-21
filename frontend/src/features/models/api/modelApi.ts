import { apiClient } from "../../../lib/apiClient";
import type {
  Model,
  UploadModelPayload,
  UploadUrlResponse,
} from "../types/model.types";

export async function getModels(projectId: string): Promise<Model[]> {
  return apiClient<Model[]>(`/models?project_id=${projectId}`);
}

export async function requestUploadUrl(
  payload: UploadModelPayload,
): Promise<UploadUrlResponse> {
  return apiClient<UploadUrlResponse>("/models/upload", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function confirmUpload(modelId: string): Promise<void> {
  await apiClient(`/models/${modelId}/confirm`, {
    method: "POST",
  });
}

export function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("S3 upload failed"));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };

    xhr.send(file);
  });
}
