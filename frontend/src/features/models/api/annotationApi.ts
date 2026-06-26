import { apiClient } from "../../../lib/apiClient";
import type { Annotation, CreateAnnotationPayload } from "../types/model.types";

export async function getAnnotations(modelId: string): Promise<Annotation[]> {
  return apiClient<Annotation[]>(`/models/${modelId}/annotations`);
}

export async function createAnnotation(
  modelId: string,
  data: CreateAnnotationPayload,
): Promise<Annotation> {
  return apiClient<Annotation>(`/models/${modelId}/annotations`, {
    method: "POST",
    body: data,
  });
}

export async function patchAnnotation(
  annotationId: string,
  data: { status?: "open" | "closed"; message?: string },
): Promise<Annotation> {
  return apiClient<Annotation>(`/annotations/${annotationId}`, {
    method: "PATCH",
    body: data,
  });
}
