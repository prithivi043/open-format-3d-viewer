import { apiClient } from "../../../lib/apiClient";
import type {
  UploadModelPayload,
  UploadUrlResponse,
  Model,
} from "../types/model.types";
import type { IFCNode } from "../../viewer/types/viewer.types";
import { isMockModeActive } from "../../../lib/mockApi";
import { localModelStore } from "../../../lib/localModelStore";


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

export async function getModelTree(modelId: string): Promise<IFCNode[]> {
  return apiClient<IFCNode[]>(`/models/${modelId}/tree`);
}

export async function getProjectModels(projectId: string): Promise<Model[]> {
  return apiClient<Model[]>(`/projects/${projectId}/models`);
}

export async function deleteModel(modelId: string): Promise<void> {
  return apiClient<void>(`/models/${modelId}`, {
    method: "DELETE",
  });
}


export function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<void> {
  if (isMockModeActive() || uploadUrl.startsWith("local://") || uploadUrl.includes("mock-s3-upload-url")) {
    let modelId = "";
    if (uploadUrl.startsWith("local://")) {
      modelId = uploadUrl.substring(8);
    } else if (uploadUrl.includes("mock-s3-upload-url")) {
      const parts = uploadUrl.split("/upload/");
      modelId = parts[parts.length - 1] || "mock-model-id";
    } else {
      modelId = "temp-mock-model-id";
    }

    return new Promise((resolve, reject) => {
      localModelStore.saveFile(modelId, file)
        .then(() => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            onProgress(Math.min(progress, 100));
            if (progress >= 100) {
              clearInterval(interval);
              resolve();
            }
          }, 80);
        })
        .catch(reject);
    });
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader(
      "Content-Type",
      "application/octet-stream",
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
