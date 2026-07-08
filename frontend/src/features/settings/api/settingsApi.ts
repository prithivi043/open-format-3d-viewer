import { apiClient } from "../../../lib/apiClient";
import type {
  ApiKey,
  ApiKeyCreated,
  Webhook,
  WebhookCreatePayload,
  WebhookUpdatePayload,
} from "../types/settings.types";

// ─── API Keys ─────────────────────────────────────────────────────────────────

/** GET /auth/keys — list all keys (masked, no raw key) */
export async function listApiKeys(): Promise<ApiKey[]> {
  const keys = await apiClient<ApiKey[]>("/auth/keys");

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    created_at: key.created_at,
    key_preview: key.key_preview ?? `${key.name.slice(0, 4)}...hidden`,
    last_used_at: key.last_used_at ?? null,
    is_active: key.is_active ?? true,
  }));
}

/** POST /auth/keys — create a new key; key is returned only once */
export async function createApiKey(name: string): Promise<ApiKeyCreated> {
  return apiClient<ApiKeyCreated>("/auth/keys", {
    method: "POST",
    body: { name },
  });
}

/** DELETE /auth/keys/:id — revoke a key */
export async function deleteApiKey(keyId: string): Promise<void> {
  await apiClient<void>(`/auth/keys/${keyId}`, { method: "DELETE" });
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

/** GET /webhooks — list all registered webhooks */
export async function listWebhooks(): Promise<Webhook[]> {
  return apiClient<Webhook[]>("/webhooks");
}

/** POST /webhooks — register a new webhook */
export async function createWebhook(
  payload: WebhookCreatePayload,
): Promise<Webhook> {
  return apiClient<Webhook>("/webhooks", { method: "POST", body: payload });
}

/** PATCH /webhooks/:id — update url / events / is_active */
export async function updateWebhook(
  webhookId: string,
  payload: WebhookUpdatePayload,
): Promise<Webhook> {
  return apiClient<Webhook>(`/webhooks/${webhookId}`, {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /webhooks/:id — remove a webhook */
export async function deleteWebhook(webhookId: string): Promise<void> {
  await apiClient<void>(`/webhooks/${webhookId}`, { method: "DELETE" });
}
