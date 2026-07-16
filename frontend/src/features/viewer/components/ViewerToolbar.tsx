import {
  Home, Maximize2, RotateCcw, Hand, ZoomIn, MousePointer2,
  Ruler, Tag, Scissors, Share2, Fullscreen, FileDown, Loader2
} from "lucide-react";
import { useState } from "react";
import { useViewerStore } from "../store/viewerStore";
import { useViewerContext } from "../context/ViewerProvider";
import type { ToolMode } from "../types/viewer.types";
import { exportModelBcf } from "../../models/api/modelApi";

interface ToolBtn {
  icon: React.ReactNode;
  label: string;
  tool?: ToolMode;
  action?: () => void;
  divider?: boolean;
}

export function ViewerToolbar() {
  const { activeTool, setActiveTool } = useViewerStore();
  const { goHome, fitToView, shareView, modelId } = useViewerContext();
  const [isExporting, setIsExporting] = useState(false);
  const userRole = useViewerStore((s) => s.userRole) || "viewer";

  const handleExportBCF = async () => {
    if (!modelId || isExporting) return;
    setIsExporting(true);
    try {
      const blob = await exportModelBcf(modelId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `model_${modelId}_bcf.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("BCF export failed:", err);
      alert("Failed to export BCF package. Ensure the backend BCF service is running.");
    } finally {
      setIsExporting(false);
    }
  };

  const isBackendModel = modelId && !modelId.startsWith("local-");

  const tools: ToolBtn[] = [
    { icon: <Home size={16} />, label: "Home", action: goHome },
    { icon: <Maximize2 size={16} />, label: "Fit", action: fitToView },
    { icon: <RotateCcw size={16} />, label: "Orbit", tool: "orbit" },
    { icon: <Hand size={16} />, label: "Pan", tool: "pan" },
    { icon: <ZoomIn size={16} />, label: "Zoom", tool: "zoom" },
    { icon: <MousePointer2 size={16} />, label: "Select", tool: "select", divider: true },
    { icon: <Ruler size={16} />, label: "Measure", tool: "measure" },
    { icon: <Tag size={16} />, label: "Annotation", tool: "annotation" },
    { icon: <Scissors size={16} />, label: "Section", tool: "section", divider: true },
    { icon: <Share2 size={16} />, label: "Share", action: shareView },
    ...(isBackendModel
      ? [
          {
            icon: isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileDown size={16} />
            ),
            label: isExporting ? "Exporting..." : "BCF",
            action: handleExportBCF,
          },
        ]
      : []),
  ];

  const isToolDisabled = (t: ToolBtn): boolean => {
    if (t.tool === "measure" && userRole === "viewer") return true;
    if (t.tool === "annotation" && userRole === "viewer") return true;
    if (t.label === "Share" && userRole !== "admin") return true;
    return false;
  };

  const getToolTitle = (t: ToolBtn): string => {
    if (t.tool === "measure" && userRole === "viewer") return "Measure (Editor & Admin only)";
    if (t.tool === "annotation" && userRole === "viewer") return "Annotation (Editor & Admin only)";
    if (t.label === "Share" && userRole !== "admin") return "Share (Admin only)";
    return t.label;
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 z-20 flex items-center h-12 px-3 gap-0.5"
      style={{
        background: "linear-gradient(180deg, rgba(8,10,26,0.98) 0%, rgba(8,10,26,0.92) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(8px)",
      }}
    >
      {tools.map((t, i) => {
        const disabled = isToolDisabled(t);
        return (
          <div key={i} className="flex items-center">
            {t.divider && (
              <div className="w-px h-6 mx-2" style={{ background: "rgba(255,255,255,0.1)" }} />
            )}
            <button
              onClick={disabled ? undefined : t.tool ? () => setActiveTool(t.tool!) : t.action}
              disabled={disabled}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded transition-all duration-150 min-w-[44px]
                ${disabled
                  ? "opacity-35 cursor-not-allowed text-gray-600"
                  : activeTool === t.tool
                  ? "bg-violet-600/30 text-violet-300"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              title={getToolTitle(t)}
            >
              {t.icon}
              <span className="text-[9px] font-medium tracking-wide uppercase opacity-80">{t.label}</span>
            </button>
          </div>
        );
      })}


      {/* Right side */}
      <div className="ml-auto flex items-center gap-1">
        <button
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-all min-w-[52px]"
          title="Fullscreen"
          onClick={() => document.documentElement.requestFullscreen?.()}
        >
          <Fullscreen size={16} />
          <span className="text-[9px] font-medium tracking-wide uppercase opacity-80">FullScreen</span>
        </button>
      </div>
    </div>
  );
}
