import { apiClient } from "../../../lib/apiClient";
import type {
  UploadModelPayload,
  UploadUrlResponse,
  Model,
} from "../types/model.types";

export async function requestUploadUrl(
  payload: UploadModelPayload,
): Promise<UploadUrlResponse> {
  return apiClient<UploadUrlResponse>("/models/upload", {
    method: "POST",
    body: JSON.stringify({
      project_id: payload.project_id,
      filename: payload.filename,
      content_type: payload.content_type,
      size_bytes: payload.size_bytes,
    }),
  });
}

export async function confirmUpload(modelId: string): Promise<void> {
  await apiClient<void>(`/models/${modelId}/confirm`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getModel(modelId: string): Promise<Model> {
  return apiClient<Model>(`/models/${modelId}`);
}

export function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };

    xhr.send(file);
  });
}
