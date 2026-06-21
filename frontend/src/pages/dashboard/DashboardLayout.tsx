import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Folder,
  Box,
  Bell,
  Pencil,
  Package,
  Plus,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../../features/auth/store/authStore";
import ProjectModal from "../../features/projects/components/ProjectModal";

const SB = {
  bg: "#0b0e1a",
  border: "rgba(255,255,255,0.07)",
  text: "#5a6080",
  textHover: "#a0a8c8",
  active: "#1a1d35",
  activeText: "#9490e0",
  activeIcon: "#534AB7",
  label: "#3a3f5c",
  divider: "rgba(255,255,255,0.06)",
} as const;

// ─── WireCube SVG ─────────────────────────────────────────
function WireCube({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="13"
        height="13"
        rx="1"
        stroke="#534AB7"
        strokeWidth="1.2"
        fill="none"
      />
      <rect
        x="13"
        y="7"
        width="13"
        height="13"
        rx="1"
        stroke="#534AB7"
        strokeWidth="0.8"
        strokeDasharray="2 1.5"
        fill="none"
        opacity="0.5"
      />
      <line
        x1="4"
        y1="3"
        x2="13"
        y2="7"
        stroke="#534AB7"
        strokeWidth="0.9"
        opacity="0.6"
      />
      <line
        x1="17"
        y1="3"
        x2="26"
        y2="7"
        stroke="#534AB7"
        strokeWidth="0.9"
        opacity="0.6"
      />
      <line
        x1="4"
        y1="16"
        x2="13"
        y2="20"
        stroke="#534AB7"
        strokeWidth="0.9"
        opacity="0.6"
      />
      <line
        x1="17"
        y1="16"
        x2="26"
        y2="20"
        stroke="#534AB7"
        strokeWidth="0.9"
        opacity="0.6"
      />
      <circle cx="4" cy="3" r="1.5" fill="#534AB7" />
      <circle cx="17" cy="3" r="1.5" fill="#534AB7" />
      <circle cx="4" cy="16" r="1.5" fill="#534AB7" />
      <circle cx="17" cy="16" r="1.5" fill="#534AB7" />
      <circle cx="13" cy="7" r="1.2" fill="#534AB7" opacity="0.55" />
      <circle cx="26" cy="7" r="1.2" fill="#534AB7" opacity="0.55" />
      <circle cx="26" cy="20" r="1.2" fill="#534AB7" opacity="0.55" />
      <circle cx="13" cy="20" r="1.2" fill="#534AB7" opacity="0.55" />
    </svg>
  );
}

function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12px]"
      style={{
        background: active ? SB.active : "transparent",
        color: active ? SB.activeText : SB.text,
      }}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[9px] px-1.5 rounded-full bg-[#534AB7] text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [openModal, setOpenModal] = useState(false);

  const initials = user?.full_name?.slice(0, 2).toUpperCase() ?? "U";

  const activeNav = location.pathname.includes("/projects")
    ? "projects"
    : "dashboard";

  const navMain = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={15} />,
      active: activeNav === "dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      label: "Projects",
      icon: <Folder size={15} />,
      active: activeNav === "projects",
      onClick: () => navigate("/projects"),
    },
    {
      label: "Models",
      icon: <Box size={15} />,
      active: false,
      onClick: () => {},
    },
    {
      label: "3D Viewer",
      icon: <Package size={15} />,
      active: false,
      onClick: () => {},
    },
    {
      label: "Annotations",
      icon: <Pencil size={15} />,
      active: false,
      onClick: () => {},
    },
    {
      label: "Notifications",
      icon: <Bell size={15} />,
      active: false,
      badge: 6,
      onClick: () => {},
    },
  ];

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-[#f8f8fc]">
        {/* YOUR ORIGINAL SIDEBAR */}
        <aside
          className="w-[200px] flex-shrink-0 flex flex-col"
          style={{
            background: SB.bg,
            borderRight: `0.5px solid ${SB.border}`,
          }}
        >
          <div
            className="flex items-center gap-2.5 px-4 py-4"
            style={{ borderBottom: `0.5px solid ${SB.border}` }}
          >
            <WireCube />
            <div>
              <p className="text-[13px] text-white">OpenFormat</p>
              <p className="text-[9px]" style={{ color: SB.label }}>
                3D VIEWER
              </p>
            </div>
          </div>

          <div className="px-3 pt-4 pb-2">
            <p
              className="text-[8px] uppercase px-2.5 mb-2"
              style={{ color: SB.label }}
            >
              Workspace
            </p>

            {navMain.map((item) => (
              <NavItem key={item.label} {...item} />
            ))}
          </div>

          <div
            className="mx-3 my-1"
            style={{ height: "0.5px", background: SB.divider }}
          />

          <div className="px-3 pb-3">
            <button
              onClick={() => setOpenModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white bg-[#534AB7]"
            >
              <Plus size={12} />
              New Project
            </button>
          </div>

          <div
            className="px-3 py-3 mt-auto"
            style={{ borderTop: `0.5px solid ${SB.border}` }}
          >
            <div
              onClick={() => navigate("/me")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-[28px] h-[28px] rounded-full bg-[#1a1d35] flex items-center justify-center text-[#534AB7]">
                {initials}
              </div>

              <div className="flex-1">
                <p className="text-[11px] text-white">
                  {user?.full_name ?? "User"}
                </p>
                <p className="text-[9px]" style={{ color: SB.label }}>
                  Free Plan
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
              >
                <LogOut size={14} color="#888" />
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT SIDE CHANGES ONLY */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <ProjectModal
        isOpen={openModal}
        project={null}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}
