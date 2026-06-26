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

  // backend may return filename instead of name
  filename: string;

  content_type: string;
  size_bytes: number;

  status: ModelStatus;

  created_at: string;
  updated_at?: string;
}

export interface UploadModelPayload {
  project_id: string;

  // PRD schema
  filename: string;
  content_type: string;
  size_bytes: number;
}

export interface UploadUrlResponse {
  upload_url: string;
  model_id: string;
}

export interface Annotation {
  id: string;
  model_id: string;
  position_xyz: number[];
  normal_xyz: number[];
  message: string;
  status: "open" | "closed";
  created_at: string;
}

export interface CreateAnnotationPayload {
  position_xyz: number[];
  normal_xyz: number[];
  message: string;
}
