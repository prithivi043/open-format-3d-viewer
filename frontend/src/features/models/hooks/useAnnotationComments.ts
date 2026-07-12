import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAnnotationComments,
  createAnnotationComment,
  patchAnnotation,
} from "../api/annotationApi";
import type { AnnotationComment, Annotation } from "../types/model.types";

export function useAnnotationComments(annotationId: string | null) {
  return useQuery<AnnotationComment[], Error>({
    queryKey: ["annotation-comments", annotationId],
    queryFn: () => getAnnotationComments(annotationId!),
    enabled: Boolean(annotationId),
    staleTime: 1000 * 5, // 5s refresh
  });
}

export function useCreateAnnotationComment(annotationId: string | null) {
  const qc = useQueryClient();
  return useMutation<AnnotationComment, Error, string>({
    mutationFn: (body: string) => createAnnotationComment(annotationId!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["annotation-comments", annotationId] });
    },
  });
}

export function useUpdateAnnotation(modelId: string) {
  const qc = useQueryClient();
  return useMutation<
    Annotation,
    Error,
    { id: string; status: "open" | "in_review" | "resolved" }
  >({
    mutationFn: ({ id, status }) => patchAnnotation(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["model-annotations", modelId] });
    },
  });
}
