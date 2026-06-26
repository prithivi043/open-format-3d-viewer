import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { useLayoutStore } from "../../stores/layoutStore";
import ProjectModal from "../../features/projects/components/ProjectModal";

const SB = {
  bg: "#0b0e1a",
  border: "rgba(255,255,255,0.07)",
  text: "#5a6080",
  active: "#1a1d35",
  activeText: "#9490e0",
  divider: "rgba(255,255,255,0.06)",
} as const;

function WireCube({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="3" width="13" height="13" rx="1" stroke="#534AB7" />
      <rect
        x="13"
        y="7"
        width="13"
        height="13"
        rx="1"
        stroke="#534AB7"
        strokeDasharray="2 1.5"
        opacity="0.5"
      />
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
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
      style={{
        background: active ? SB.active : "transparent",
        color: active ? SB.activeText : SB.text,
      }}
    >
      <span>{icon}</span>
      <span className="flex-1 text-left">{label}</span>

      {badge ? (
        <span className="text-[10px] font-semibold px-2 py-[1px] rounded-full bg-[#534AB7] text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeNav, setActiveNav } = useLayoutStore();

  const [openModal, setOpenModal] = useState(false);

  const initials = user?.full_name?.slice(0, 2).toUpperCase() ?? "U";

  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith("/dashboard")) {
      setActiveNav("dashboard");
    } else if (path.startsWith("/projects") && !path.startsWith("/projects/")) {
      setActiveNav("projects");
    } else if (path.startsWith("/models")) {
      setActiveNav("models");
    } else if (path.startsWith("/viewer")) {
      setActiveNav("viewer");
    } else if (path.startsWith("/annotations")) {
      setActiveNav("annotations");
    }
  }, [location.pathname, setActiveNav]);

  const navMain = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
      active: activeNav === "dashboard",
      onClick: () => {
        setActiveNav("dashboard");
        navigate("/dashboard");
      },
    },
    {
      label: "Projects",
      icon: <Folder size={16} />,
      active: activeNav === "projects",
      onClick: () => {
        setActiveNav("projects");
        navigate("/projects");
      },
    },
    {
      label: "Models",
      icon: <Box size={15} />,
      active: activeNav === "models",
      onClick: () => {
        setActiveNav("models");
        navigate("/models/upload");
      },
    },
    {
      label: "3D Viewer",
      icon: <Package size={15} />,
      active: activeNav === "viewer",
      onClick: () => {},
    },
    {
      label: "Annotations",
      icon: <Pencil size={16} />,
      active: activeNav === "annotations",
      onClick: () => setActiveNav("annotations"),
    },
  ];

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-[#f8f8fc]">
        <aside
          className="w-[220px] flex-shrink-0 flex flex-col"
          style={{
            background: SB.bg,
            borderRight: `0.5px solid ${SB.border}`,
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-5"
            style={{ borderBottom: `0.5px solid ${SB.border}` }}
          >
            <WireCube />
            <div>
              <p className="text-[15px] font-semibold text-white">OpenFormat</p>
              <p
                className="text-[11px] font-medium mt-1"
                style={{ color: "#6f7592" }}
              >
                3D VIEWER
              </p>
            </div>
          </div>

          <div className="px-3 pt-5 pb-3">
            <p
              className="px-2.5 mb-3 text-[10px] font-semibold uppercase"
              style={{ color: "#666c8b" }}
            >
              Workspace
            </p>

            <div className="space-y-1">
              {navMain.map((item) => (
                <NavItem key={item.label} {...item} />
              ))}
            </div>
          </div>

          <div
            className="mx-3 my-2"
            style={{ height: "0.5px", background: SB.divider }}
          />

          <div className="px-3 pb-4">
            <button
              onClick={() => setOpenModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-[#534AB7] text-[13px] font-semibold text-white hover:bg-[#4638a6]"
            >
              <Plus size={14} />
              New Project
            </button>
          </div>

          <div
            className="px-3 py-4 mt-auto"
            style={{ borderTop: `0.5px solid ${SB.border}` }}
          >
            <div
              onClick={() => navigate("/me")}
              className="flex items-center gap-3 cursor-pointer rounded-xl px-2 py-2 hover:bg-white/[0.03]"
            >
              <div className="w-[34px] h-[34px] text-[12px] font-semibold rounded-full bg-[#1a1d35] flex items-center justify-center text-[#534AB7]">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate">
                  {user?.full_name ?? "User"}
                </p>
                <p
                  className="text-[10px] font-medium mt-1"
                  style={{ color: "#6f7592" }}
                >
                  Free Plan
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                className="opacity-70 hover:opacity-100"
              >
                <LogOut size={14} color="#888" />
              </button>
            </div>
          </div>
        </aside>

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
