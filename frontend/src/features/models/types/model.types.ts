export type ModelFormat =
  | "ifc"
  | "xkt"
  | "glb"
  | "gltf"
  | "fbx"
  | "obj"
  | "step"
  | "stl";

export type ModelStatus = "uploading" | "processing" | "ready" | "failed";

export interface Model {
  id: string;
  project_id: string;
  name: string;
  format: ModelFormat;
  file_size_bytes: number;
  status: ModelStatus;
  created_at: string;
  updated_at?: string;
}

export interface UploadModelPayload {
  project_id: string;
  name: string;
  format: ModelFormat;
  file_size_bytes: number;
}

export interface UploadUrlResponse {
  upload_url: string;
  model_id: string;
}
