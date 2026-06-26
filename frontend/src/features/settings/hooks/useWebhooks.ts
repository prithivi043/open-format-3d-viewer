import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from "../api/settingsApi";
import type {
  Webhook,
  WebhookCreatePayload,
  WebhookUpdatePayload,
} from "../types/settings.types";

const HOOKS_QK = ["settings", "webhooks"] as const;

/** Fetch all registered webhooks */
export function useWebhooks() {
  return useQuery({
    queryKey: HOOKS_QK,
    queryFn: listWebhooks,
    staleTime: 30_000,
  });
}

/** Register a new webhook */
export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation<Webhook, Error, WebhookCreatePayload>({
    mutationFn: (payload) => createWebhook(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOOKS_QK });
    },
  });
}

/** Toggle active / update a webhook */
export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation<Webhook, Error, { id: string; payload: WebhookUpdatePayload }>({
    mutationFn: ({ id, payload }) => updateWebhook(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOOKS_QK });
    },
  });
}

/** Remove a webhook */
export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteWebhook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOOKS_QK });
    },
  });
}
