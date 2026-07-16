import { useViewerStore } from "../store/viewerStore";
import { useViewerContext } from "../context/ViewerProvider";
import { useAuthStore } from "../../auth/store/authStore";
import { X, Shield, User, Eye, Circle } from "lucide-react";

export function ActiveMembersPanel() {
  const { projectMembers, userRole, isMembersPanelOpen, setMembersPanelOpen } = useViewerStore();
  const { peerCursors, isConnected } = useViewerContext();
  const currentUser = useAuthStore((s) => s.user);

  if (!isMembersPanelOpen) return null;

  // Active peers in the session (via WebSocket cursors)
  const activePeerIds = Object.keys(peerCursors || {});

  // Combine projectMembers list and the current logged-in user
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

  const getRoleBadge = (role?: string) => {
    const r = role?.toLowerCase() || "viewer";
    if (r === "admin") {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20 uppercase tracking-wider">
          <Shield size={8} /> Admin
        </span>
      );
    }
    if (r === "editor") {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
          <User size={8} /> Editor
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[9px] font-semibold text-gray-400 bg-gray-500/10 px-1.5 py-0.5 rounded border border-gray-500/20 uppercase tracking-wider">
        <Eye size={8} /> Viewer
      </span>
    );
  };

  return (
    <div
      className="absolute bottom-12 right-3 z-50 w-72 rounded-2xl border border-white/10 p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3.5 select-none"
      style={{
        background: "rgba(8, 10, 26, 0.96)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[12px] font-bold text-gray-200 tracking-wide uppercase">
            Collaboration Room
          </h3>
          <p className="text-[9px] text-gray-500">
            {sortedParticipants.filter((p) => isOnline(p.id)).length} of{" "}
            {sortedParticipants.length} active online
          </p>
        </div>
        <button
          onClick={() => setMembersPanelOpen(false)}
          className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors duration-150"
          title="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Participants list */}
      <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto custom-scroll pr-1">
        {sortedParticipants.length === 0 && (
          <p className="text-[10px] text-gray-500 text-center py-4 italic">
            No participants found
          </p>
        )}
        {sortedParticipants.map((peer) => {
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
              className={`flex items-center gap-3 p-1.5 rounded-xl border border-transparent transition-all duration-150
                ${online ? "bg-white/[0.02] border-white/5" : "opacity-45 grayscale-[20%]"}`}
            >
              {/* Avatar with initials & online status badge */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white relative ring-2 ring-white/5 shadow-inner"
                style={{ background: peer.avatarColor }}
              >
                {initials}
                <div
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#080a1a] transition-colors duration-500
                    ${online ? "bg-emerald-400" : "bg-slate-500"}`}
                />
              </div>

              {/* Name & Role Details */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-200 truncate">
                    {peer.fullName}
                  </span>
                  {isSelf && (
                    <span className="text-[8px] font-bold text-violet-400 bg-violet-400/10 px-1 rounded uppercase">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(peer.role)}
                  <span
                    className={`text-[8px] font-semibold flex items-center gap-0.5 ${
                      online ? "text-emerald-400" : "text-gray-500"
                    }`}
                  >
                    <Circle size={4} fill={online ? "#34d399" : "#6b7280"} />
                    {online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
