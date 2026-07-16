import { useViewerStore } from "../store/viewerStore";
import { useViewerContext } from "../context/ViewerProvider";
import { useAuthStore } from "../../auth/store/authStore";

export function ViewerStatusBar() {
  const { elementCount, loadingProgress, fps, projectMembers, userRole, isMembersPanelOpen, setMembersPanelOpen } =
    useViewerStore();

  const { peerCursors, isConnected } = useViewerContext();
  const currentUser = useAuthStore((s) => s.user);

  // Active peers = people currently in the session (have cursor data)
  const activePeerIds = Object.keys(peerCursors || {});

  // Combine projectMembers and currentUser to make sure everyone is represented
  const participants = [...projectMembers];
  if (currentUser && !participants.some((p) => p.id === currentUser.id)) {
    participants.push({
      id: currentUser.id,
      fullName: currentUser.full_name,
      avatarColor: "#3b82f6",
      role: userRole || "viewer",
    });
  }

  const isOnline = (memberId: string) => {
    if (memberId === currentUser?.id) return isConnected;
    return activePeerIds.includes(memberId);
  };

  // Sort: Online members first, then Offline members
  const sortedParticipants = [...participants].sort((a, b) => {
    const aOnline = isOnline(a.id);
    const bOnline = isOnline(b.id);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  const displayParticipants = sortedParticipants.slice(0, 6);
  const extraCount = Math.max(0, sortedParticipants.length - 6);

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
        <span className="text-[10px] text-gray-500 font-medium select-none">
          Collaboration Room:
        </span>

        <div
          onClick={() => setMembersPanelOpen(!isMembersPanelOpen)}
          className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-100"
          title="Toggle collaboration participants panel"
        >
          {displayParticipants.map((peer) => {
            const initials = peer.fullName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const online = isOnline(peer.id);
            const isSelf = peer.id === currentUser?.id;
            
            return (
              <div
                key={peer.id}
                title={`${peer.fullName} (${peer.role || "Viewer"})${isSelf ? " (You)" : ""} — ${online ? "Online" : "Offline"}`}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#080a1a] cursor-pointer transition-all duration-150 hover:scale-110 hover:z-10 relative
                  ${online ? "" : "opacity-45 grayscale-[20%]"}`}
                style={{ background: peer.avatarColor }}
              >
                {initials}
                {/* Online/Offline Status indicator dot */}
                <div
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#080a1a] transition-colors duration-500
                    ${online ? "bg-emerald-400" : "bg-slate-500"}`}
                />
              </div>
            );
          })}

          {extraCount > 0 && (
            <div
              title={`+${extraCount} more collaborators`}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#080a1a] bg-slate-600 select-none"
            >
              +{extraCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

