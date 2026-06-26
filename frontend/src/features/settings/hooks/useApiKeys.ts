import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listApiKeys, createApiKey, deleteApiKey } from "../api/settingsApi";
import type { ApiKeyCreated } from "../types/settings.types";

const KEYS_QK = ["settings", "api-keys"] as const;

/** Fetch all API keys for the authenticated user */
export function useApiKeys() {
  return useQuery({
    queryKey: KEYS_QK,
    queryFn: listApiKeys,
    staleTime: 30_000,
  });
}

/** Create a new key — returns the raw key once */
export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation<ApiKeyCreated, Error, string>({
    mutationFn: (name: string) => createApiKey(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS_QK });
    },
  });
}

/** Revoke / delete a key by id */
export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteApiKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS_QK });
    },
  });
}
