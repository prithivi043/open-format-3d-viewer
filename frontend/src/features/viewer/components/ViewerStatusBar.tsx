import { useViewerStore } from "../store/viewerStore";
import { useViewerContext } from "../context/ViewerProvider";

export function ViewerStatusBar() {
  const { elementCount, loadingProgress, fps, projectMembers } =
    useViewerStore();

  const { peerCursors, isConnected } = useViewerContext();

  // Active peers = people currently in the session (have cursor data)
  const activePeerIds = Object.keys(peerCursors || {});
  const activePeerCount = activePeerIds.length;

  // Show avatar bubbles for active peers first, then fill from project members
  const activePeers = activePeerIds
    .map((id) => {
      const cursor = peerCursors[id];
      const member = projectMembers.find((m) => m.id === id);
      return {
        id,
        name: cursor?.name || member?.fullName || `User ${id.slice(0, 4)}`,
        avatarColor: cursor?.avatarColor || member?.avatarColor || "#7c3aed",
      };
    })
    .slice(0, 5);

  const extraCount = Math.max(0, activePeerCount - 5);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 flex items-center h-9 px-4 gap-4"
      style={{
        background:
          "linear-gradient(0deg, rgba(8,10,26,0.98) 0%, rgba(8,10,26,0.92) 100%)",
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

      <div
        className="w-px h-4"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />

      {/* Loading progress */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500">Loading</span>
        <div
          className="w-24 h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${loadingProgress}%`,
              background:
                loadingProgress < 100
                  ? "linear-gradient(90deg, #7c3aed, #06b6d4)"
                  : "#10b981",
            }}
          />
        </div>
        <span className="text-[10px] font-medium text-gray-300">
          {Math.round(loadingProgress)}%
        </span>
      </div>

      <div
        className="w-px h-4"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />

      {/* FPS — PRD §4.5: warn user if < 30fps */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">FPS</span>
        <span
          className={`text-[10px] font-medium ${
            fps < 30 ? "text-red-400" : fps < 45 ? "text-amber-400" : "text-emerald-400"
          }`}
        >
          {fps}
        </span>
        {fps < 30 && (
          <span className="text-[9px] font-medium text-red-400/80 bg-red-500/10 px-1.5 py-0.5 rounded">
            Low FPS
          </span>
        )}
      </div>

      {/* Right side: live collaboration status */}
      <div className="ml-auto flex items-center gap-3">
        {/* WebSocket connection indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
            }`}
          />
          <span className="text-[10px] text-gray-500">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>

        {activePeerCount > 0 && (
          <>
            <div
              className="w-px h-4"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />

            {/* Active peer avatars */}
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1.5">
                {activePeers.map((peer) => {
                  const initials = peer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div
                      key={peer.id}
                      title={`${peer.name} — viewing now`}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#080a1a] cursor-default transition-transform duration-150 hover:scale-110 hover:z-10"
                      style={{ background: peer.avatarColor }}
                    >
                      {initials}
                    </div>
                  );
                })}
                {extraCount > 0 && (
                  <div
                    title={`+${extraCount} more collaborators`}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#080a1a] bg-slate-600"
                  >
                    +{extraCount}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400">
                {activePeerCount} viewing
              </span>
            </div>
          </>
        )}

        {activePeerCount === 0 && projectMembers.length > 0 && (
          <>
            <div
              className="w-px h-4"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <span className="text-[10px] text-gray-600">
              {projectMembers.length}{" "}
              {projectMembers.length === 1 ? "member" : "members"} · no one else
              viewing
            </span>
          </>
        )}
      </div>
    </div>
  );
}
