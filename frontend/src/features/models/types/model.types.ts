export type ModelFormat =
  | "ifc"
  | "xkt"
  | "glb"
  | "gltf"
  | "fbx"
  | "obj"
  | "step"
  | "stl";

export type ModelStatus = "uploading" | "pending" | "processing" | "ready" | "failed";

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
  storage_key?: string;
}

export interface Annotation {
  id: string;
  model_id: string;
  title: string;
  body: string | null;
  position: {
    x: number;
    y: number;
    z: number;
    normal_x: number;
    normal_y: number;
    normal_z: number;
  };
  status: "open" | "closed";
  created_at: string;
}

export interface CreateAnnotationPayload {
  title: string;
  body: string | null;
  position: {
    x: number;
    y: number;
    z: number;
    normal_x: number;
    normal_y: number;
    normal_z: number;
  };
}

export interface ModelElement {
  id: string;
  model_id: string;
  guid: string;
  element_type: string | null;
  name: string | null;
  properties: Record<string, unknown> | null;
  created_at: string;
}

export interface AnnotationComment {
  id: string;
  annotation_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}
