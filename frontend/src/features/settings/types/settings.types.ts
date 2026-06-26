// ─── API Key ──────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  key_preview?: string;
  last_used_at?: string | null;
  is_active?: boolean;
  created_at: string;
}

/** Returned once when a key is first created — never again */
export interface ApiKeyCreated {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | "model.uploaded"
  | "model.processed"
  | "annotation.created"
  | "annotation.deleted"
  | "project.created"
  | "project.deleted";

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookCreatePayload {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

export interface WebhookUpdatePayload {
  url?: string;
  events?: WebhookEvent[];
  is_active?: boolean;
}

// ─── Rate limits ─────────────────────────────────────────────────────────────

export type PlanType = "Free" | "Pro" | "Enterprise";

export interface PlanLimits {
  plan: PlanType;
  api_calls_per_hour: number | null; // null = unlimited
  uploads_per_day: number | null;
  max_file_size_mb: number | null;
}
