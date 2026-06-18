import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  Box,
  BarChart2,
  Plus,
  Upload,
  Search,
  Bell,
  Settings,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Database,
  Activity,
  ArrowRight,
  Building2,
  Train,
  Home,
  Users,
  Cloud,
  Loader,
} from "lucide-react";
import { useAuthStore } from "../../features/auth/store/authStore";

// ─── Types ────────────────────────────────────────────────
interface Project {
  id: string;
  name: string;
  models: number;
  status: "Ready" | "Processing" | "Draft";
  updatedAt: string;
  icon: React.ReactNode;
  color: "purple" | "teal" | "amber" | "gray";
}

// ─── Design tokens ────────────────────────────────────────
// FIX 1: 3 clear surface levels instead of 5 near-identical darks
const BG = {
  page: "#05080f", // deepest — page canvas
  sidebar: "#080c18", // raised — sidebar, topbar
  surface: "#0b0f1a", // cards, rows
  border: "#1c2136", // borders — visible but not loud
  borderHover: "#262c42", // hover state borders
} as const;

// FIX 2: 4-level text hierarchy with semantic meaning
const TEXT = {
  primary: "#dde0f0", // names, values, headings
  label: "#8a90ac", // section labels, eyebrows
  muted: "#555b78", // meta, secondary info
  ghost: "#3a3f58", // decorative only — dots, timestamps
} as const;

const ACCENT = {
  purple: { bg: "#12153a", text: "#7f77dd", solid: "#534AB7" },
  teal: { bg: "#081a10", text: "#1D9E75", solid: "#1D9E75" },
  amber: { bg: "#160f04", text: "#BA7517", solid: "#BA7517" },
  gray: { bg: "#0d0d14", text: "#555b78", solid: "#3a3f58" },
} as const;

const STATUS_STYLE = {
  Ready: "bg-[#081a10] text-[#1D9E75]",
  Processing: "bg-[#160f04] text-[#BA7517]",
  Draft: "bg-[#0d0d14] text-[#555b78] border border-[#1c2136]",
} as const;

// ─── Wireframe cube ───────────────────────────────────────
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

// ─── System status ────────────────────────────────────────
function SystemStatus() {
  return (
    <div
      className="flex items-center gap-2 px-4 py-[7px]"
      style={{ borderBottom: `0.5px solid ${BG.border}`, background: BG.page }}
    >
      <span className="relative flex h-[5px] w-[5px]">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1D9E75] opacity-40" />
        <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-[#1D9E75]" />
      </span>
      <span
        className="font-mono text-[8px] uppercase tracking-[0.14em]"
        style={{ color: "#1D9E75" }}
      >
        All Systems Nominal
      </span>
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────
function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[11.5px] mb-[1px] transition-all duration-150"
      style={{
        background: active ? "#12153a" : "transparent",
        color: active ? "#9490e0" : TEXT.muted,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = BG.surface;
          e.currentTarget.style.color = TEXT.label;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = TEXT.muted;
        }
      }}
    >
      <span style={{ color: active ? "#534AB7" : TEXT.muted, flexShrink: 0 }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────
// FIX 3: solid accent line inset from edges — always visible on dark bg
// FIX 4: JS-driven progress animation via useRef — no missing Tailwind keyframe
function StatCard({
  label,
  value,
  unit,
  delta,
  deltaType,
  icon,
  accentColor,
  showProgress = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta: string;
  deltaType: "up" | "neutral";
  icon: React.ReactNode;
  accentColor: string;
  showProgress?: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showProgress || !barRef.current) return;
    let width = 25;
    let dir = 1;
    const tick = setInterval(() => {
      width += dir * 1.2;
      if (width >= 78) dir = -1;
      if (width <= 18) dir = 1;
      if (barRef.current) barRef.current.style.width = `${width}%`;
    }, 30);
    return () => clearInterval(tick);
  }, [showProgress]);

  return (
    <div
      className="rounded-[9px] px-3.5 py-3 relative overflow-hidden cursor-default transition-colors duration-150"
      style={{ background: BG.surface, border: `0.5px solid ${BG.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = BG.borderHover)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BG.border)}
    >
      {/* FIX 3: solid inset accent bar — visible on any dark surface */}
      <div
        className="absolute top-0 rounded-b-sm"
        style={{
          left: 10,
          right: 10,
          height: "1.5px",
          background: accentColor,
        }}
      />

      {/* Label + icon */}
      <div className="flex items-center justify-between mb-2 mt-0.5">
        <span
          className="font-mono text-[8.5px] tracking-[0.1em] uppercase"
          style={{ color: TEXT.muted }}
        >
          {label}
        </span>
        <span style={{ color: accentColor }}>{icon}</span>
      </div>

      {/* Value */}
      <p
        className="text-[22px] font-semibold leading-none"
        style={{ color: TEXT.primary }}
      >
        {value}
        {unit && (
          <span
            className="text-[12px] font-normal ml-1"
            style={{ color: TEXT.muted }}
          >
            {unit}
          </span>
        )}
      </p>

      {/* Delta */}
      <p
        className="font-mono text-[9px] mt-1.5 flex items-center gap-1"
        style={{ color: deltaType === "up" ? "#1D9E75" : TEXT.ghost }}
      >
        <TrendingUp size={9} />
        {delta}
      </p>

      {/* FIX 4: JS-driven progress bar — no Tailwind keyframe needed */}
      {showProgress && (
        <div
          className="mt-2 h-[2px] rounded-full overflow-hidden"
          style={{ background: BG.border }}
        >
          <div
            ref={barRef}
            className="h-full rounded-full transition-[width] duration-75"
            style={{ width: "25%", background: "#BA7517" }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Project row ──────────────────────────────────────────
function ProjectRow({
  project,
  onView,
  onOpen,
}: {
  project: Project;
  onView: (e: React.MouseEvent) => void;
  onOpen: () => void;
}) {
  const ac = ACCENT[project.color];
  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150"
      style={{ background: BG.surface, border: `0.5px solid ${BG.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = BG.borderHover)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BG.border)}
    >
      {/* Project icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: ac.bg, color: ac.text }}
      >
        {project.icon}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[12px] font-medium truncate"
          style={{ color: TEXT.primary }}
        >
          {project.name}
        </p>
        {/* FIX 5: was #2a2d3a (border color) — now TEXT.ghost which passes contrast */}
        <p
          className="font-mono text-[9px] mt-0.5"
          style={{ color: TEXT.ghost }}
        >
          {project.models} models · {project.updatedAt}
        </p>
      </div>

      {/* Status */}
      <span
        className={`font-mono text-[9px] tracking-[0.04em] px-2 py-[3px] rounded-full flex-shrink-0 ${STATUS_STYLE[project.status]}`}
      >
        {project.status}
      </span>

      {/* Actions */}
      <div className="flex gap-1.5">
        {[
          { icon: <Eye size={12} />, label: "Open viewer", onClick: onView },
          {
            icon: <MoreHorizontal size={12} />,
            label: "More options",
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
        ].map(({ icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            aria-label={label}
            className="w-6 h-6 rounded-[5px] flex items-center justify-center transition-colors duration-150"
            style={{
              border: `0.5px solid ${BG.border}`,
              background: "transparent",
              color: TEXT.ghost,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = BG.borderHover;
              e.currentTarget.style.color = "#7f77dd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = BG.border;
              e.currentTarget.style.color = TEXT.ghost;
            }}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Right panel section label ────────────────────────────
function PanelLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: string;
}) {
  return (
    <p
      className="font-mono text-[8.5px] tracking-[0.16em] uppercase flex items-center gap-1.5 mb-2"
      style={{ color: TEXT.ghost }}
    >
      {icon}
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const initials = user?.name?.charAt(0).toUpperCase() ?? "U";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // Greeting based on hour
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const projects: Project[] = [
    {
      id: "1",
      name: "Airport BIM",
      models: 12,
      status: "Ready",
      updatedAt: "2h ago",
      icon: <Building2 size={14} />,
      color: "purple",
    },
    {
      id: "2",
      name: "Hospital Design",
      models: 4,
      status: "Processing",
      updatedAt: "5h ago",
      icon: <Box size={14} />,
      color: "teal",
    },
    {
      id: "3",
      name: "Metro Station",
      models: 8,
      status: "Ready",
      updatedAt: "Yesterday",
      icon: <Train size={14} />,
      color: "amber",
    },
    {
      id: "4",
      name: "Residential Complex",
      models: 2,
      status: "Draft",
      updatedAt: "3d ago",
      icon: <Home size={14} />,
      color: "gray",
    },
  ];

  const activity = [
    { label: "Airport BIM — model uploaded", time: "2h ago", color: "#534AB7" },
    {
      label: "Hospital Design — processing started",
      time: "5h ago",
      color: "#BA7517",
    },
    {
      label: "Metro Station — shared with team",
      time: "1d ago",
      color: "#1D9E75",
    },
    {
      label: "Residential Complex — created",
      time: "3d ago",
      color: TEXT.ghost,
    },
  ];

  const formats = ["GLB", "OBJ", "FBX", "IFC", "STEP", "STL"];

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={14} />,
      active: true,
      onClick: () => {},
    },
    {
      label: "Projects",
      icon: <Folder size={14} />,
      active: false,
      onClick: () => navigate("/projects"),
    },
    {
      label: "All Models",
      icon: <Box size={14} />,
      active: false,
      onClick: () => {},
    },
    {
      label: "Analytics",
      icon: <BarChart2 size={14} />,
      active: false,
      onClick: () => {},
    },
    {
      label: "Team",
      icon: <Users size={14} />,
      active: false,
      onClick: () => {},
    },
  ];

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: BG.page, color: TEXT.primary }}
    >
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside
        className="w-[196px] flex-shrink-0 flex flex-col"
        style={{
          background: BG.sidebar,
          borderRight: `0.5px solid ${BG.border}`,
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-2.5 px-4 py-4"
          style={{ borderBottom: `0.5px solid ${BG.border}` }}
        >
          <WireCube />
          <div>
            <p
              className="text-[13px] font-semibold leading-tight"
              style={{ color: TEXT.primary }}
            >
              OpenFormat
            </p>
            <p
              className="font-mono text-[8px] tracking-[0.16em] mt-0.5"
              style={{ color: TEXT.ghost }}
            >
              3D VIEWER
            </p>
          </div>
        </div>

        {/* System status */}
        <SystemStatus />

        {/* Nav */}
        <div className="px-3 pt-4 pb-2">
          <p
            className="font-mono text-[8px] tracking-[0.18em] uppercase px-2 mb-2"
            style={{ color: TEXT.ghost }}
          >
            Workspace
          </p>
          {navItems.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </div>

        {/* New project CTA */}
        <div className="px-3 pb-3">
          <button
            onClick={() => alert("Create Project")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-[11px] tracking-[0.04em] transition-colors duration-150"
            style={{ background: "#534AB7", color: "#EEEDFE" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#3C3489")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#534AB7")}
          >
            <Plus size={12} /> New Project
          </button>
        </div>

        {/* Recent */}
        <div className="px-3 flex-1 overflow-hidden">
          <p
            className="font-mono text-[8px] tracking-[0.18em] uppercase px-2 mb-2"
            style={{ color: TEXT.ghost }}
          >
            Recent
          </p>
          {projects.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-2.5 py-[5px] rounded-lg cursor-pointer transition-colors duration-150"
              style={{ color: TEXT.muted }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = BG.surface)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                style={{ background: ACCENT[p.color].solid }}
              />
              {/* FIX 5: readable muted text, not near-invisible #2d3150 */}
              <span
                className="text-[10.5px] truncate flex-1"
                style={{ color: TEXT.muted }}
              >
                {p.name}
              </span>
              <span
                className="font-mono text-[9px]"
                style={{ color: TEXT.ghost }}
              >
                {p.models}
              </span>
            </div>
          ))}
        </div>

        {/* User footer */}
        <div
          className="px-3 py-3 mt-auto"
          style={{ borderTop: `0.5px solid ${BG.border}` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
              style={{
                background: "#12153a",
                color: "#534AB7",
                border: `0.5px solid ${BG.border}`,
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-medium truncate"
                style={{ color: TEXT.primary }}
              >
                {user?.name ?? "User"}
              </p>
              <p
                className="font-mono text-[8px] mt-0.5"
                style={{ color: TEXT.ghost }}
              >
                Project Lead
              </p>
            </div>
            <button
              onClick={logout}
              className="transition-colors duration-150"
              style={{ color: TEXT.ghost, background: "none", border: "none" }}
              aria-label="Settings"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#534AB7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = TEXT.ghost)}
            >
              <Settings size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
          style={{
            background: BG.sidebar,
            borderBottom: `0.5px solid ${BG.border}`,
          }}
        >
          <div>
            <p
              className="font-mono text-[8.5px] tracking-[0.28em] uppercase mb-1"
              style={{ color: "#534AB7" }}
            >
              Dashboard · Overview
            </p>
            <h1
              className="text-[15px] font-semibold"
              style={{ color: TEXT.primary }}
            >
              {greeting}, {firstName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-[6px] rounded-lg text-[11px] cursor-pointer transition-colors duration-150"
              style={{
                background: BG.surface,
                border: `0.5px solid ${BG.border}`,
                color: TEXT.muted,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = BG.borderHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = BG.border)
              }
            >
              <Search size={13} />
              <span>Search projects…</span>
            </div>

            {/* Bell */}
            <button
              aria-label="Notifications"
              className="w-[30px] h-[30px] flex items-center justify-center rounded-lg transition-colors duration-150"
              style={{
                border: `0.5px solid ${BG.border}`,
                background: BG.surface,
                color: TEXT.muted,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7f77dd")}
              onMouseLeave={(e) => (e.currentTarget.style.color = TEXT.muted)}
            >
              <Bell size={14} />
            </button>

            {/* Upload */}
            <button
              onClick={() => alert("Upload Model")}
              className="flex items-center gap-1.5 px-3.5 py-[6px] rounded-lg font-mono text-[11px] tracking-[0.04em] transition-colors duration-150"
              style={{ background: "#534AB7", color: "#EEEDFE" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#3C3489")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#534AB7")
              }
            >
              <Upload size={12} /> Upload model
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center column */}
          <div
            className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: `${BG.border} transparent`,
            }}
          >
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard
                label="Projects"
                value={24}
                delta="+3 this month"
                deltaType="up"
                icon={<Folder size={13} />}
                accentColor="#534AB7"
              />
              <StatCard
                label="Models"
                value={156}
                delta="+12 this week"
                deltaType="up"
                icon={<Box size={13} />}
                accentColor="#1D9E75"
              />
              <StatCard
                label="Processing"
                value={3}
                delta="2 queued"
                deltaType="neutral"
                icon={<Loader size={13} />}
                accentColor="#BA7517"
                showProgress
              />
              <StatCard
                label="Storage"
                value="6.2"
                unit="GB"
                delta="of 10 GB used"
                deltaType="neutral"
                icon={<Database size={13} />}
                accentColor={TEXT.ghost}
              />
            </div>

            {/* Recent projects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: TEXT.primary }}
                >
                  Recent projects
                </h2>
                <button
                  onClick={() => navigate("/projects")}
                  className="flex items-center gap-1 font-mono text-[9.5px] transition-colors duration-150"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#534AB7",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#7f77dd")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#534AB7")
                  }
                >
                  View all <ArrowRight size={11} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {projects.map((p) => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    onView={(e) => {
                      e.stopPropagation();
                      navigate(`/viewer/${p.id}`);
                    }}
                    onOpen={() => navigate(`/projects/${p.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div
            className="w-[210px] flex-shrink-0 overflow-y-auto px-4 py-4 flex flex-col gap-5"
            style={{
              borderLeft: `0.5px solid ${BG.border}`,
              background: BG.sidebar,
              scrollbarWidth: "thin",
              scrollbarColor: `${BG.border} transparent`,
            }}
          >
            {/* Quick upload */}
            <div>
              <PanelLabel icon={<Upload size={11} />}>Quick upload</PanelLabel>
              <div
                className="rounded-lg p-4 text-center cursor-pointer transition-colors duration-150"
                style={{ border: `0.5px dashed ${BG.border}` }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "#534AB7";
                  (e.currentTarget as HTMLDivElement).style.background =
                    BG.surface;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    BG.border;
                  (e.currentTarget as HTMLDivElement).style.background =
                    "transparent";
                }}
              >
                <Cloud
                  size={20}
                  className="mx-auto mb-2"
                  style={{ color: TEXT.ghost }}
                />
                <p className="text-[10.5px]" style={{ color: TEXT.muted }}>
                  Drop model here
                </p>
                <p
                  className="font-mono text-[9px] mt-1"
                  style={{ color: TEXT.ghost }}
                >
                  .glb · .obj · .fbx · .ifc
                </p>
              </div>
            </div>

            {/* Storage */}
            <div>
              <PanelLabel icon={<Database size={11} />}>Storage</PanelLabel>
              <div
                className="h-[3px] rounded-full overflow-hidden"
                style={{ background: BG.border }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: "62%", background: "#534AB7" }}
                />
              </div>
              <div
                className="flex justify-between font-mono text-[9px] mt-1.5"
                style={{ color: TEXT.ghost }}
              >
                <span>6.2 GB used</span>
                <span>10 GB</span>
              </div>
            </div>

            {/* Formats */}
            <div>
              <PanelLabel icon={<Box size={11} />}>Formats</PanelLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {formats.map((f) => (
                  <div
                    key={f}
                    className="px-2 py-[5px] rounded-[5px] font-mono text-[9.5px] text-center tracking-[0.06em]"
                    style={{
                      background: BG.surface,
                      border: `0.5px solid ${BG.border}`,
                      color: TEXT.muted,
                    }}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div>
              <PanelLabel icon={<Activity size={11} />}>Activity</PanelLabel>
              <div>
                {activity.map((a, i) => (
                  <div
                    key={i}
                    className="flex gap-2 py-2"
                    style={{
                      borderBottom:
                        i < activity.length - 1
                          ? `0.5px solid ${BG.border}`
                          : "none",
                    }}
                  >
                    <div
                      className="w-[5px] h-[5px] rounded-full mt-[5px] flex-shrink-0"
                      style={{ background: a.color }}
                    />
                    <div>
                      <p
                        className="text-[10.5px] leading-snug"
                        style={{ color: TEXT.muted }}
                      >
                        {a.label}
                      </p>
                      <p
                        className="font-mono text-[8.5px] mt-0.5"
                        style={{ color: TEXT.ghost }}
                      >
                        {a.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
