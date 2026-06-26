import { useState } from "react";
import {
  Plus,
  Trash2,
  ExternalLink,
  Webhook,
  AlertCircle,
  Loader2,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  useUpdateWebhook,
} from "../hooks/useWebhooks";
import type { WebhookEvent, WebhookCreatePayload } from "../types/settings.types";
import { relativeTime } from "../utils/settingsUtils";

const ALL_EVENTS: WebhookEvent[] = [
  "model.uploaded",
  "model.processed",
  "annotation.created",
  "annotation.deleted",
  "project.created",
  "project.deleted",
];

export default function WebhooksTab() {
  const { data: webhooks = [], isLoading, isError, error } = useWebhooks();
  const createMutation = useCreateWebhook();
  const deleteMutation = useDeleteWebhook();
  const updateMutation = useUpdateWebhook();

  const [showDialog,      setShowDialog]      = useState(false);
  const [newUrl,          setNewUrl]          = useState("");
  const [newEvents,       setNewEvents]       = useState<WebhookEvent[]>([]);
  const [urlError,        setUrlError]        = useState("");

  function toggleEvent(e: WebhookEvent) {
    setNewEvents((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  }

  function isValidUrl(u: string) {
    try { new URL(u); return true; } catch { return false; }
  }

  async function handleCreate() {
    if (!isValidUrl(newUrl)) { setUrlError("Enter a valid HTTPS URL"); return; }
    if (newEvents.length === 0) { setUrlError("Select at least one event"); return; }
    const payload: WebhookCreatePayload = { url: newUrl, events: newEvents };
    await createMutation.mutateAsync(payload);
    setShowDialog(false);
    setNewUrl("");
    setNewEvents([]);
    setUrlError("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this webhook? This cannot be undone.")) return;
    await deleteMutation.mutateAsync(id);
  }

  async function handleToggle(id: string, current: boolean) {
    await updateMutation.mutateAsync({ id, payload: { is_active: !current } });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Webhooks</h2>
          <p className="text-sm text-[#888] mt-0.5">
            Receive real-time notifications for model and annotation events
          </p>
        </div>
        <button
          onClick={() => { setShowDialog(true); setUrlError(""); }}
          className="flex items-center gap-2 bg-[#7c3aed] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#6d28d9] transition-colors"
        >
          <Plus size={14} />
          Register webhook
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-[#aaa]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading webhooks…</span>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-12 gap-2 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">{(error as Error).message}</span>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#d9cfc4] p-10 text-center">
          <Webhook size={24} className="mx-auto text-[#ccc] mb-2" />
          <p className="text-sm text-[#aaa]">No webhooks registered yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-2xl border border-[#ede8e0] p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span
                  className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${
                    w.is_active ? "bg-emerald-500" : "bg-[#ccc]"
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={w.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm text-[#1a1a1a] truncate hover:underline"
                    >
                      {w.url}
                    </a>
                    <ExternalLink size={12} className="text-[#aaa] shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {w.events.map((e) => (
                      <span
                        key={e}
                        className="text-xs bg-[#f0ebe3] text-[#555] px-2 py-0.5 rounded-full font-mono"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[#aaa] mt-1.5">
                    Created {relativeTime(w.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Toggle active */}
                <button
                  onClick={() => handleToggle(w.id, w.is_active)}
                  disabled={updateMutation.isPending}
                  title={w.is_active ? "Disable" : "Enable"}
                  className="p-1.5 rounded-lg hover:bg-[#f5f0ea] transition-colors text-[#666] disabled:opacity-40"
                >
                  {w.is_active
                    ? <ToggleRight size={18} className="text-emerald-500" />
                    : <ToggleLeft  size={18} className="text-[#ccc]" />
                  }
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  disabled={deleteMutation.isPending}
                  title="Remove webhook"
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[#999] hover:text-red-500 disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available events reference */}
      <div className="bg-white rounded-2xl border border-[#ede8e0] p-5">
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Available Events</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALL_EVENTS.map((e) => (
            <div
              key={e}
              className="flex items-center gap-2 text-xs text-[#555] bg-[#faf7f3] rounded-lg px-3 py-2 font-mono"
            >
              <span className="w-1.5 h-1.5 bg-[#7c3aed] rounded-full shrink-0" />
              {e}
            </div>
          ))}
        </div>
      </div>

      {/* ── Register webhook dialog ── */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[460px] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[#1a1a1a]">Register Webhook</h3>
              <button onClick={() => setShowDialog(false)} className="text-[#aaa] hover:text-[#555]">
                <X size={18} />
              </button>
            </div>

            <label className="block text-sm text-[#555] mb-1.5">Endpoint URL</label>
            <input
              value={newUrl}
              onChange={(e) => { setNewUrl(e.target.value); setUrlError(""); }}
              placeholder="https://your-app.io/webhooks"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${
                urlError ? "border-red-400 focus:border-red-400" : "border-[#ede8e0] focus:border-[#7c3aed]"
              }`}
            />
            {urlError && <p className="mt-1 text-xs text-red-500">{urlError}</p>}

            <p className="text-sm text-[#555] mt-4 mb-2">Events to subscribe</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_EVENTS.map((e) => (
                <label
                  key={e}
                  className={`flex items-center gap-2 border rounded-xl px-3 py-2 cursor-pointer text-xs transition-all ${
                    newEvents.includes(e)
                      ? "border-[#7c3aed] bg-[#f5f0ff] text-[#7c3aed]"
                      : "border-[#ede8e0] text-[#555] hover:border-[#c4b5fd]"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={newEvents.includes(e)}
                    onChange={() => toggleEvent(e)}
                  />
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      newEvents.includes(e) ? "bg-[#7c3aed] border-[#7c3aed]" : "border-[#ccc]"
                    }`}
                  >
                    {newEvents.includes(e) && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                  <span className="font-mono">{e}</span>
                </label>
              ))}
            </div>

            {createMutation.isError && (
              <p className="mt-3 text-xs text-red-500">
                {(createMutation.error as Error).message}
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 border border-[#ede8e0] text-sm text-[#555] py-2.5 rounded-xl hover:bg-[#faf7f3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex-1 bg-[#7c3aed] text-white text-sm py-2.5 rounded-xl font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
