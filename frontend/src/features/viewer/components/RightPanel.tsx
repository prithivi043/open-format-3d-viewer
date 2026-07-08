import { useState } from "react";
import { Plus, CheckCircle2, Circle, Clock, Info, Tag, Hash, Layers } from "lucide-react";
import { useViewerStore } from "../store/viewerStore";
import type { PropertyRow } from "../types/viewer.types";

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PropertyGroupSection({ group, rows }: { group: string; rows: PropertyRow[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        className="flex items-center gap-1.5 w-full px-4 py-1.5 text-left group"
        onClick={() => setOpen((o) => !o)}
      >
        <Layers size={10} className="text-violet-400 flex-shrink-0" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-violet-400 group-hover:text-violet-300 transition-colors">
          {group}
        </span>
        <span className="ml-auto text-[9px] text-gray-600">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="px-4 space-y-0">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex justify-between py-[4px] border-b"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
            >
              <span className="text-[11px] text-gray-500 flex-shrink-0 mr-2 max-w-[100px]">
                {row.label}
              </span>
              <span
                className="text-[11px] text-gray-200 text-right truncate"
                title={row.value}
              >
                {row.value || "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertiesPanel() {
  const { selectedProperties } = useViewerStore();

  if (!selectedProperties) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-5 gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <Info size={18} className="text-violet-400 opacity-60" />
        </div>
        <p className="text-[11px] text-gray-500 text-center leading-relaxed">
          Click an element in the viewer to inspect its properties
        </p>
      </div>
    );
  }

  // Group the attributes by their "group" field
  const ungrouped: PropertyRow[] = [];
  const grouped: Record<string, PropertyRow[]> = {};

  for (const attr of selectedProperties.attributes) {
    if (attr.group && attr.group !== "Properties") {
      (grouped[attr.group] ??= []).push(attr);
    } else {
      ungrouped.push(attr);
    }
  }

  const hasAnyAttributes =
    selectedProperties.attributes.length > 0 ||
    selectedProperties.elementName ||
    selectedProperties.ifcType;

  return (
    <div className="flex-1 overflow-y-auto custom-scroll">
      {/* Identity section — always shown */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[10px] font-bold tracking-widest uppercase text-violet-400 mb-2 flex items-center gap-1.5">
          <Tag size={10} />
          Identity
        </p>

        <div className="space-y-0">
          {[
            { label: "Name", value: selectedProperties.elementName },
            { label: "IFC Type", value: selectedProperties.ifcType },
            { label: "Global ID", value: selectedProperties.globalModelId.slice(0, 22) + "…" },
          ].map((row, i) => (
            <div
              key={i}
              className="flex justify-between py-[4px] border-b"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
            >
              <span className="text-[11px] text-gray-500 flex-shrink-0 mr-2">{row.label}</span>
              <span
                className="text-[11px] text-gray-200 text-right truncate max-w-[130px]"
                title={row.value}
              >
                {row.value || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ungrouped attributes */}
      {ungrouped.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] font-bold tracking-widest uppercase text-violet-400 mb-2 flex items-center gap-1.5">
            <Hash size={10} />
            Properties
          </p>
          <div className="space-y-0">
            {ungrouped.map((row, i) => (
              <div
                key={i}
                className="flex justify-between py-[4px] border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <span className="text-[11px] text-gray-500 flex-shrink-0 mr-2 max-w-[100px]">
                  {row.label}
                </span>
                <span
                  className="text-[11px] text-gray-200 text-right truncate"
                  title={row.value}
                >
                  {row.value || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped property sets */}
      {Object.entries(grouped).map(([group, rows]) => (
        <PropertyGroupSection key={group} group={group} rows={rows} />
      ))}

      {!hasAnyAttributes && (
        <p className="text-[11px] text-gray-600 text-center px-4 py-4">
          No metadata available for this element.
        </p>
      )}

      {/* Add Annotation button */}
      <div className="px-4 pt-2 pb-3">
        <button
          className="w-full py-2 rounded text-[12px] font-medium text-white transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          onClick={() => {
            useViewerStore.getState().setActiveTool("annotation");
            window.dispatchEvent(new CustomEvent("show-annotation-toast"));
          }}
        >
          <Plus size={13} />
          Add Annotation
        </button>
      </div>
    </div>
  );
}

// ─── Annotations List ─────────────────────────────────────────────────────────

function AnnotationsList() {
  const { annotations, selectedAnnotationId, setSelectedAnnotationId } = useViewerStore();
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const filtered = annotations.filter((a) => filter === "all" || a.status === filter);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-2">
        {(["all", "open", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-0.5 rounded text-[10px] font-medium capitalize transition-all
              ${filter === f ? "bg-violet-600/40 text-violet-300" : "text-gray-500 hover:text-gray-300"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll px-3 pb-3 space-y-2">
        {filtered.length === 0 && (
          <p className="text-[11px] text-gray-500 text-center py-8">No annotations yet</p>
        )}
        {filtered.map((ann) => (
          <div
            key={ann.id}
            onClick={() => setSelectedAnnotationId(ann.id === selectedAnnotationId ? null : ann.id)}
            className={`p-2.5 rounded cursor-pointer transition-all
              ${selectedAnnotationId === ann.id ? "bg-violet-600/20 border-violet-500/30" : "hover:bg-white/5 border-transparent"}`}
            style={{ border: "1px solid", borderColor: selectedAnnotationId === ann.id ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-start gap-2">
              {ann.status === "closed"
                ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                : <Circle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-200 leading-snug">{ann.message}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={9} className="text-gray-600" />
                  <span className="text-[9px] text-gray-600">{formatTime(ann.createdAt)}</span>
                  <span
                    className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-medium
                      ${ann.status === "open" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}
                  >
                    {ann.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 pb-3">
        <button
          className="w-full py-2 rounded text-[12px] font-medium text-white transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
          onClick={() => {
            useViewerStore.getState().setActiveTool("annotation");
            window.dispatchEvent(new CustomEvent("show-annotation-toast"));
          }}
        >
          <Plus size={13} />
          New Issue
        </button>
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

export function RightPanel() {
  const { activeRightTab, setActiveRightTab } = useViewerStore();

  return (
    <div
      className="absolute right-3 top-14 z-10 flex flex-col w-[240px]"
      style={{
        background: "rgba(8,10,26,0.92)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "6px",
        backdropFilter: "blur(12px)",
        maxHeight: "calc(100vh - 100px)",
      }}
    >
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {(["properties", "annotations"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveRightTab(tab)}
            className={`flex-1 py-2.5 text-[11px] font-semibold capitalize tracking-wide transition-all
              ${activeRightTab === tab
                ? "text-white border-b-2 border-violet-500"
                : "text-gray-500 hover:text-gray-300"
              }`}
            style={{ borderBottom: activeRightTab === tab ? "2px solid #7c3aed" : "2px solid transparent" }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeRightTab === "properties" ? <PropertiesPanel /> : <AnnotationsList />}
    </div>
  );
}
