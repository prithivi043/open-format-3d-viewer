import { localModelStore } from "./localModelStore";

export interface UploadModelOptions {
  projectId: string;
  file: File;
  onProgress?: (pct: number) => void;
}

export interface UploadModelResult {
  modelId: string;
  storageType: "local" | "cloud";
}

export function isLocalMode(): boolean {
  // If the user has localStorage use_mock_api active, or if VITE_LOCAL_MODEL_MODE is set to true/missing
  const mockApiActive = localStorage.getItem("use_mock_api") === "true";
  const env = import.meta.env.VITE_LOCAL_MODEL_MODE;
  const isEnvLocal = env === undefined || env === "" || env === "true";
  
  return mockApiActive || isEnvLocal;
}

export async function uploadModel(
  opts: UploadModelOptions,
): Promise<UploadModelResult> {
  if (isLocalMode()) {
    return localUpload(opts);
  }
  return cloudUpload(opts);
}

async function localUpload({
  file,
  onProgress,
}: UploadModelOptions): Promise<UploadModelResult> {
  const modelId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Simulate progressive upload for the UI progress bar
  await simulateProgress(onProgress);

  await localModelStore.saveFile(modelId, file);

  return { modelId, storageType: "local" };
}

async function cloudUpload(opts: UploadModelOptions): Promise<UploadModelResult> {
  const { requestUploadUrl, uploadFileToS3, confirmUpload } = await import(
    "../features/models/api/modelApi"
  );

  try {
    const uploadData = await requestUploadUrl({
      project_id: opts.projectId,
      filename: opts.file.name,
      content_type: "application/octet-stream",
      size_bytes: opts.file.size,
    });

    await uploadFileToS3(uploadData.upload_url, opts.file, (pct) => {
      opts.onProgress?.(pct);
    });

    await confirmUpload(uploadData.model_id);

    return { modelId: uploadData.model_id, storageType: "cloud" };
  } catch (err) {
    console.warn("Cloud upload failed, falling back to local IndexedDB storage:", err);
    return localUpload(opts);
  }
}

function simulateProgress(
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    if (!onProgress) {
      resolve();
      return;
    }
    let pct = 0;
    const id = setInterval(() => {
      pct = Math.min(pct + 12, 100);
      onProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        resolve();
      }
    }, 80);
  });
}
