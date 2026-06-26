import { ChevronDown } from "lucide-react";
import { useViewerStore } from "../store/viewerStore";

const AVATAR_COLORS = ["#7c3aed", "#0891b2", "#059669", "#d97706"];
const INITIALS = ["PK", "YW", "ES", "MK"];

export function ViewerStatusBar() {
  const { elementCount, loadingProgress, fps, onlineCount } = useViewerStore();

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 flex items-center h-9 px-4 gap-4"
      style={{
        background: "linear-gradient(0deg, rgba(8,10,26,0.98) 0%, rgba(8,10,26,0.92) 100%)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Element count */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">Elements:</span>
        <span className="text-[10px] font-medium text-gray-300">
          {elementCount.toLocaleString()}
        </span>
      </div>

      <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* Loading progress */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500">Loading</span>
        <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${loadingProgress}%`,
              background: loadingProgress < 100
                ? "linear-gradient(90deg, #7c3aed, #06b6d4)"
                : "#10b981",
            }}
          />
        </div>
        <span className="text-[10px] font-medium text-gray-300">{Math.round(loadingProgress)}%</span>
      </div>

      <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* FPS */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">FPS</span>
        <button className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-400">
          {fps}
          <ChevronDown size={10} className="text-gray-500" />
        </button>
      </div>

      {/* Right side: online users */}
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center -space-x-1.5">
          {INITIALS.slice(0, onlineCount).map((init, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-[#080a1a]"
              style={{ background: AVATAR_COLORS[i] }}
              title={init}
            >
              {init}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-gray-400">{onlineCount} Online</span>
        </div>
      </div>
    </div>
  );
}
