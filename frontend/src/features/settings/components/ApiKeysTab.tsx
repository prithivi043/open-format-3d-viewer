import { useState } from "react";
import {
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Crown,
  Building2,
  Loader2,
} from "lucide-react";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "../hooks/useApiKeys";
import type { ApiKeyCreated, PlanType } from "../types/settings.types";
import { relativeTime, copyToClipboard } from "../utils/settingsUtils";

const PLAN_LIMITS: Record<
  PlanType,
  { api: string; uploads: string; fileSize: string }
> = {
  Free: { api: "100 / hour", uploads: "5 / day", fileSize: "50 MB" },
  Pro: { api: "10,000 / hour", uploads: "100 / day", fileSize: "500 MB" },
  Enterprise: { api: "Unlimited", uploads: "Unlimited", fileSize: "5 GB" },
};

interface Props {
  /** Current plan from auth store (defaults to "Free" if not returned by backend yet) */
  plan?: PlanType;
}

export default function ApiKeysTab({ plan = "Free" }: Props) {
  const { data: keys = [], isLoading, isError, error } = useApiKeys();
  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealed, setRevealed] = useState<ApiKeyCreated | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleCopy(text: string, id: string) {
    copyToClipboard(text, () => setCopiedId(null));
    setCopiedId(id);
  }

  function handleOpenDialog() {
    setNewKeyName("");
    setRevealed(null);
    setShowDialog(true);
  }

  function handleCloseDialog() {
    setShowDialog(false);
    setRevealed(null);
    setNewKeyName("");
  }

  async function handleGenerate() {
    if (!newKeyName.trim()) return;
    const created = await createMutation.mutateAsync(newKeyName.trim());
    setRevealed(created);
    console.log("created key response:", created);
    setNewKeyName("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    await deleteMutation.mutateAsync(id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">API Keys</h2>
          <p className="text-sm text-[#888] mt-0.5">
            Manage your API keys to access the open 3D format
          </p>
        </div>
        <button
          onClick={handleOpenDialog}
          className="flex items-center gap-2 bg-[#7c3aed] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#6d28d9] transition-colors"
        >
          <Plus size={14} />
          Generate new Key
        </button>
      </div>

      {/* Keys table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#ede8e0]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-[#aaa]">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading keys…</span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-12 gap-2 text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm">{(error as Error).message}</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 text-[#bbb]">
            <p className="text-sm">
              No API keys yet. Generate one to get started.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0ebe3]">
                {["Key Name", "Key", "Last used", "Status", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-[#888] font-medium"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {keys.map((k, i) => (
                <tr
                  key={k.id}
                  className={
                    i < keys.length - 1 ? "border-b border-[#f5f0ea]" : ""
                  }
                >
                  <td className="px-5 py-4 font-medium text-[#1a1a1a]">
                    {k.name}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-[#555]">
                    {k.key_preview ?? "Not available"}
                  </td>
                  <td className="px-5 py-4 text-[#777]">
                    {relativeTime(k.last_used_at ?? null)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs font-semibold ${
                        k.is_active ? "text-emerald-600" : "text-[#aaa]"
                      }`}
                    >
                      {(k.is_active ?? true) ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(k.id)}
                        disabled={deleteMutation.isPending}
                        title="Revoke key"
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[#999] hover:text-red-500 disabled:opacity-40"
                      >
                        <Tras h2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rate limits */}
      <div className="bg-white rounded-2xl border border-[#ede8e0] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-[#7c3aed]" />
          <h3 className="font-semibold text-[#1a1a1a]">Rate Limits</h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#ede8e0]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#faf7f3]">
                {[
                  "Plan",
                  "API calls / hour",
                  "Uploads / day",
                  "Max file size",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[#888] font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["Free", "Pro", "Enterprise"] as PlanType[]).map((p) => (
                <tr
                  key={p}
                  className={`border-t border-[#f0ebe3] ${plan === p ? "bg-[#f5f0ff]" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p === "Free" && (
                        <span className="flex items-center gap-1 font-medium text-[#555]">
                          <Zap size={12} /> Free
                        </span>
                      )}
                      {p === "Pro" && (
                        <span className="flex items-center gap-1 font-medium text-[#7c3aed]">
                          <Crown size={12} /> Pro
                        </span>
                      )}
                      {p === "Enterprise" && (
                        <span className="flex items-center gap-1 font-medium text-amber-600">
                          <Building2 size={12} /> Enterprise
                        </span>
                      )}
                      {plan === p && (
                        <span className="text-[10px] bg-[#7c3aed] text-white px-1.5 py-0.5 rounded-full">
                          current
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#555]">
                    {PLAN_LIMITS[p].api}
                  </td>
                  <td className="px-4 py-3 text-[#555]">
                    {PLAN_LIMITS[p].uploads}
                  </td>
                  <td className="px-4 py-3 text-[#555]">
                    {PLAN_LIMITS[p].fileSize}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#999] mt-3">
          Rate limit headers on every response:{" "}
          {[
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
          ].map((h) => (
            <code
              key={h}
              className="bg-[#f0ebe3] px-1 py-0.5 rounded text-[#555] mx-0.5"
            >
              {h}
            </code>
          ))}{" "}
          (Unix timestamp)
        </p>
      </div>

      {/* ── Generate key dialog ── */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[420px] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[#1a1a1a]">
                Generate new API Key
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-[#aaa] hover:text-[#555]"
              >
                <X size={18} />
              </button>
            </div>

            {!revealed ? (
              <>
                <label className="block text-sm text-[#555] mb-1.5">
                  Key name
                </label>
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder="e.g. Production API"
                  className="w-full border border-[#ede8e0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#7c3aed] transition-colors"
                  autoFocus
                />
                {createMutation.isError && (
                  <p className="mt-2 text-xs text-red-500">
                    {(createMutation.error as Error).message}
                  </p>
                )}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleCloseDialog}
                    className="flex-1 border border-[#ede8e0] text-sm text-[#555] py-2.5 rounded-xl hover:bg-[#faf7f3] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!newKeyName.trim() || createMutation.isPending}
                    className="flex-1 bg-[#7c3aed] text-white text-sm py-2.5 rounded-xl font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createMutation.isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Generate Key
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={16}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-amber-700">
                      Copy this key now — it will never be shown again.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#faf7f3] border border-[#ede8e0] rounded-xl px-4 py-3">
                  <code className="text-xs font-mono text-[#333] flex-1 break-all select-all">
                    {revealed.key}
                  </code>
                  <button
                    onClick={() => handleCopy(revealed.key, "generated")}
                    className="text-[#777] hover:text-[#7c3aed] shrink-0"
                  >
                    {copiedId === "generated" ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleCloseDialog}
                  className="w-full mt-5 bg-[#7c3aed] text-white text-sm py-2.5 rounded-xl font-medium hover:bg-[#6d28d9] transition-colors"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
