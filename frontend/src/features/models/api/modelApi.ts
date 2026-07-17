import { apiClient } from "../../../lib/apiClient";
import { useAuthStore } from "../../auth/store/authStore";
import type {
  UploadModelPayload,
  UploadUrlResponse,
  Model,
  ModelElement,
} from "../types/model.types";
import type { IFCNode } from "../../viewer/types/viewer.types";
import { isMockModeActive } from "../../../lib/mockApi";
import { localModelStore } from "../../../lib/localModelStore";


export async function requestUploadUrl(
  payload: UploadModelPayload,
): Promise<UploadUrlResponse> {
  return apiClient<UploadUrlResponse>("/models/upload", {
    method: "POST",
    body: {
      project_id: payload.project_id,
      filename: payload.filename,
      content_type: payload.content_type,
      size_bytes: payload.size_bytes,
    },
  });
}

export async function confirmUpload(modelId: string): Promise<void> {
  await apiClient<void>(`/models/${modelId}/confirm`, {
    method: "POST",
    body: {},
  });
}

export async function uploadFileLocal(
  storageKey: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `/v1/models/upload/local?storage_key=${encodeURIComponent(storageKey)}`;

    xhr.open("POST", url);
    
    const token = useAuthStore.getState().accessToken;
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    
    const csrfToken = document.cookie.split("; ").find((c) => c.startsWith("csrf_token="))?.split("=")[1];
    if (csrfToken) {
      xhr.setRequestHeader("X-CSRF-Token", csrfToken);
    }

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
        reject(new Error(`Local dev upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during local dev upload"));
    };

    xhr.send(file);
  });
}

export async function getModel(modelId: string): Promise<Model> {
  return apiClient<Model>(`/models/${modelId}`);
}

export async function getModelTree(modelId: string): Promise<IFCNode[]> {
  return apiClient<IFCNode[]>(`/models/${modelId}/tree`);
}

export async function getProjectModels(projectId: string): Promise<Model[]> {
  let localModels: Model[] = [];
  try {
    const saved = localStorage.getItem(`local_models_${projectId}`);
    if (saved) {
      localModels = JSON.parse(saved);
    }
  } catch (err) {
    console.error("Failed to parse local models from localStorage:", err);
  }

  // Update status for server-side models by querying GET /models/{model_id} in parallel.
  // This is in strict compliance with the PRD specification which defines GET /models/{model_id}
  // but does not include any model list endpoints.
  const updatedModels = await Promise.all(
    localModels.map(async (model) => {
      if (model.id.startsWith("local-")) {
        return model;
      }
      try {
        const serverModel = await apiClient<Model>(`/models/${model.id}`, {
          silent: true,
        });
        return {
          ...model,
          status: serverModel.status || model.status,
          filename: serverModel.filename || model.filename,
          content_type: serverModel.content_type || model.content_type,
          size_bytes: serverModel.size_bytes || model.size_bytes,
          created_at: serverModel.created_at || model.created_at,
        };
      } catch (err) {
        console.warn(`Failed to sync model ${model.id} status with server:`, err);
        return model;
      }
    })
  );

  return updatedModels;
}

export async function deleteModel(modelId: string): Promise<void> {
  try {
    await apiClient<void>(`/models/${modelId}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("Failed to delete model from backend:", err);
  }

  try {
    await localModelStore.deleteFile(modelId);
  } catch (err) {
    console.warn("Failed to delete model file from IndexedDB:", err);
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("local_models_")) {
        const data = localStorage.getItem(key);
        if (data) {
          const list = JSON.parse(data) as Model[];
          const filtered = list.filter((m) => m.id !== modelId);
          if (filtered.length !== list.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to delete model metadata from localStorage:", err);
  }
}

export async function getElementByGuid(
  modelId: string,
  guid: string,
): Promise<ModelElement> {
  return apiClient<ModelElement>(`/models/${modelId}/elements/${guid}`);
}

export async function exportModelBcf(modelId: string): Promise<Blob> {
  const token = useAuthStore.getState().accessToken;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "/v1";
  
  // Normalize apiBase url
  let baseUrl = apiBase;
  if (apiBase.endsWith("/v1")) {
    baseUrl = apiBase.slice(0, -3);
  }
  const url = `${baseUrl}/v1/models/${modelId}/export/bcf`;

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers, credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to export BCF package");
  }
  return res.blob();
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
