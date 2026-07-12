import { useQuery } from "@tanstack/react-query";
import { getElementByGuid } from "../api/modelApi";
import type { ModelElement } from "../types/model.types";

export function useElementByGuid(modelId: string, guid: string | null) {
  return useQuery<ModelElement, Error>({
    queryKey: ["model-element", modelId, guid],
    queryFn: () => getElementByGuid(modelId, guid!),
    enabled: Boolean(modelId && guid),
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
}
