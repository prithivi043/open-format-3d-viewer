import {
  Home, Maximize2, RotateCcw, Hand, ZoomIn, MousePointer2,
  Ruler, Tag, Scissors, Share2, Settings, Fullscreen,
} from "lucide-react";
import { useViewerStore } from "../store/viewerStore";
import type { ToolMode } from "../types/viewer.types";

interface ToolBtn {
  icon: React.ReactNode;
  label: string;
  tool?: ToolMode;
  action?: () => void;
  divider?: boolean;
}

export function ViewerToolbar() {
  const { activeTool, setActiveTool } = useViewerStore();

  const tools: ToolBtn[] = [
    { icon: <Home size={16} />, label: "Home", action: () => {} },
    { icon: <Maximize2 size={16} />, label: "Fit", action: () => {} },
    { icon: <RotateCcw size={16} />, label: "Orbit", tool: "orbit" },
    { icon: <Hand size={16} />, label: "Pan", tool: "pan" },
    { icon: <ZoomIn size={16} />, label: "Zoom", tool: "zoom" },
    { icon: <MousePointer2 size={16} />, label: "Select", tool: "select", divider: true },
    { icon: <Ruler size={16} />, label: "Measure", tool: "measure" },
    { icon: <Tag size={16} />, label: "Annotation", tool: "annotation" },
    { icon: <Scissors size={16} />, label: "Section", tool: "section", divider: true },
    { icon: <Share2 size={16} />, label: "Share", action: () => {} },
    { icon: <Settings size={16} />, label: "Setting", action: () => {} },
  ];

  return (
    <div
      className="absolute top-0 left-0 right-0 z-20 flex items-center h-12 px-3 gap-0.5"
      style={{
        background: "linear-gradient(180deg, rgba(8,10,26,0.98) 0%, rgba(8,10,26,0.92) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(8px)",
      }}
    >
      {tools.map((t, i) => (
        <div key={i} className="flex items-center">
          {t.divider && (
            <div className="w-px h-6 mx-2" style={{ background: "rgba(255,255,255,0.1)" }} />
          )}
          <button
            onClick={t.tool ? () => setActiveTool(t.tool!) : t.action}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded transition-all duration-150 min-w-[44px]
              ${activeTool === t.tool
                ? "bg-violet-600/30 text-violet-300"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            title={t.label}
          >
            {t.icon}
            <span className="text-[9px] font-medium tracking-wide uppercase opacity-80">{t.label}</span>
          </button>
        </div>
      ))}

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
