import { apiClient } from "../../../lib/apiClient";
import type { Annotation, CreateAnnotationPayload, AnnotationComment } from "../types/model.types";

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
  data: { status?: "open" | "in_review" | "resolved"; title?: string; body?: string },
): Promise<Annotation> {
  return apiClient<Annotation>(`/annotations/${annotationId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteAnnotation(
  annotationId: string,
): Promise<void> {
  return apiClient<void>(`/annotations/${annotationId}`, {
    method: "DELETE",
  });
}

export async function getAnnotationComments(
  annotationId: string,
): Promise<AnnotationComment[]> {
  return apiClient<AnnotationComment[]>(`/annotations/${annotationId}/comments`);
}

export async function createAnnotationComment(
  annotationId: string,
  body: string,
): Promise<AnnotationComment> {
  return apiClient<AnnotationComment>(`/annotations/${annotationId}/comments`, {
    method: "POST",
    body: { body },
  });
}
