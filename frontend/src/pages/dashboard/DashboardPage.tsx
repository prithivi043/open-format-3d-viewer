import { useState, useMemo } from "react";

import { useNavigate } from "react-router-dom";
import {
  Folder,
  Box,
  Bell,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Database,
  Search,
  Users,
  Building2,
  Train,
  Package,
  Cloud,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useProjects } from "../../features/projects/hooks/useProjects";
import ProjectModal from "../../features/projects/components/ProjectModal";

interface DashboardProject {
  id: string;
  name: string;
  models: number;
  members: number;
  status: "Ready" | "Processing" | "Draft";
  updatedAt: string;
  icon: React.ReactNode;
  accentBg: string;
  accentIcon: string;
  thumbGradient: string;
}

interface ActivityItem {
  file: string;
  action: string;
  time: string;
  dotColor: string;
}

const ACCENT = [
  {
    bg: "#EEEDFE",
    icon: "#534AB7",
    thumb: "linear-gradient(135deg,#e8e4ff,#d0ccf8)",
  },
  {
    bg: "#e1f5ee",
    icon: "#1D9E75",
    thumb: "linear-gradient(135deg,#ddf3ec,#b8e8d8)",
  },
  {
    bg: "#faeeda",
    icon: "#BA7517",
    thumb: "linear-gradient(135deg,#fff5e0,#fde5b0)",
  },
  {
    bg: "#e6f1fb",
    icon: "#378ADD",
    thumb: "linear-gradient(135deg,#e0eeff,#bed3f7)",
  },
] as const;

const ICONS = [
  <Building2 size={18} />,
  <Box size={18} />,
  <Package size={18} />,
  <Train size={18} />,
];

const STATUS_CLASS: Record<string, string> = {
  Ready: "bg-[#e1f5ee] text-[#0F6E56]",
  Processing: "bg-[#faeeda] text-[#854F0B]",
  Draft: "bg-gray-100 text-gray-500 border border-gray-200",
};

const ACTIVITY_COLORS = ["#534AB7", "#1D9E75", "#BA7517", "#378ADD", "#E24B4A"];

// ─── Helpers ──────────────────────────────────────────────
function timeAgo(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return `${diffWk}w ago`;
  return date.toLocaleDateString();
}

function bytesToGB(bytes: number): string {
  if (!bytes || bytes === 0) return "0";
  return (bytes / 1_073_741_824).toFixed(1);
}

function storagePct(usedBytes: number, totalBytes: number): number {
  if (!totalBytes) return 0;
  return Math.min(100, Math.round((usedBytes / totalBytes) * 100));
}

// ─── Stat card ────────────────────────────────────────────
function StatCard({
  label,
  value,
  unit,
  delta,
  deltaPositive,
  icon,
  accentColor,
  iconBg,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta: string;
  deltaPositive: boolean;
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
}) {
  return (
    <div
      className="relative bg-white rounded-[10px] px-4 py-3.5 overflow-hidden transition-all duration-150 cursor-default"
      style={{ border: "0.5px solid #e5e7eb" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
    >
      <div
        className="absolute top-0 rounded-b-sm"
        style={{ left: 12, right: 12, height: 2, background: accentColor }}
      />
      <div className="flex items-center justify-between mb-2.5 mt-0.5">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-gray-400">
          {label}
        </span>
        <div
          className="w-[28px] h-[28px] rounded-lg flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
      </div>
      <p className="text-[26px] font-medium leading-none text-gray-900">
        {value}
        {unit && (
          <span className="text-[13px] font-normal text-gray-400 ml-1">
            {unit}
          </span>
        )}
      </p>
      <p
        className="font-mono text-[10px] mt-1.5 flex items-center gap-1"
        style={{ color: deltaPositive ? "#1D9E75" : "#9ca3af" }}
      >
        <TrendingUp size={10} />
        {delta}
      </p>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────
function ProjectCard({
  project,
  onView,
  onOpen,
}: {
  project: DashboardProject;
  onView: (e: React.MouseEvent) => void;
  onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-[10px] overflow-hidden cursor-pointer transition-all duration-150"
      style={{ border: "0.5px solid #e5e7eb" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#c7d2fe")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
    >
      <div
        className="h-[82px] flex items-center justify-center"
        style={{ background: project.thumbGradient }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: project.accentBg }}
        >
          <span style={{ color: project.accentIcon }}>{project.icon}</span>
        </div>
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <p className="text-[12px] font-medium text-gray-900 truncate mb-0.5">
          {project.name}
        </p>
        <p className="font-mono text-[10px] text-gray-400 mb-1">
          {project.models > 0 ? `${project.models} Models` : "No models yet"} ·{" "}
          {project.members} Member{project.members !== 1 ? "s" : ""}
        </p>
        <p className="font-mono text-[9px] text-gray-400 mb-2.5">
          Updated {project.updatedAt}
        </p>
        <div className="flex items-center justify-between">
          <span
            className={`font-mono text-[9px] tracking-[0.03em] px-2 py-[3px] rounded-full ${STATUS_CLASS[project.status]}`}
          >
            {project.status}
          </span>
          <div className="flex gap-1">
            <button
              onClick={onView}
              aria-label="Open viewer"
              className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-gray-400 transition-colors duration-150 hover:text-[#534AB7]"
              style={{ border: "0.5px solid #e5e7eb" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#a5b4fc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e5e7eb")
              }
            >
              <Eye size={11} />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label="More options"
              className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-gray-400 transition-colors duration-150 hover:text-[#534AB7]"
              style={{ border: "0.5px solid #e5e7eb" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#a5b4fc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e5e7eb")
              }
            >
              <MoreHorizontal size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Storage donut ────────────────────────────────────────
function StorageDonut({ pct }: { pct: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      aria-label={`Storage ${pct}% used`}
    >
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth="8"
      />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={pct > 80 ? "#E24B4A" : "#534AB7"}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text
        x="40"
        y="37"
        textAnchor="middle"
        fontSize="13"
        fontWeight="500"
        fill="#111827"
      >
        {pct}%
      </text>
      <text x="40" y="50" textAnchor="middle" fontSize="9" fill="#9ca3af">
        used
      </text>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const [openModal, setOpenModal] = useState(false);

  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const initials = user?.full_name?.slice(0, 2).toUpperCase() ?? "U";
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const openProjects = () => navigate("/projects");

  // ── Derived stats ──────────────────────────────────────
  const totalProjects = projects.length;

  const totalModels = useMemo(
    () => projects.reduce((sum, p) => sum + p.modelCount, 0),
    [projects],
  );

  const totalCollaborators = useMemo(
    () => projects.reduce((sum, p) => sum + p.memberCount, 0),
    [projects],
  );

  const totalStorageBytes = useMemo(
    () => projects.reduce((sum, p) => sum + p.storageBytes, 0),
    [projects],
  );

  const STORAGE_LIMIT_BYTES = 200 * 1_073_741_824;
  const storageUsedGB = bytesToGB(totalStorageBytes);
  const storagePctVal = storagePct(totalStorageBytes, STORAGE_LIMIT_BYTES);

  // ── Dashboard project cards ────────────────────────────
  const dashboardProjects: DashboardProject[] = useMemo(
    () =>
      projects.slice(0, 4).map((p, i) => {
        const accent = ACCENT[i % ACCENT.length] ?? ACCENT[0];
        const icon = ICONS[i % ICONS.length] ?? <Folder size={18} />;

        return {
          id: p.id,
          name: p.name,
          models: p.modelCount,
          members: p.memberCount,
          status: p.status,
          updatedAt: timeAgo(p.updatedAt ?? p.createdAt),
          icon,
          accentBg: accent.bg,
          accentIcon: accent.icon,
          thumbGradient: accent.thumb,
        };
      }),
    [projects],
  );

  // ── Activity feed ──────────────────────────────────────
  const activity: ActivityItem[] = useMemo(
    () =>
      [...projects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt ?? b.createdAt).getTime() -
            new Date(a.updatedAt ?? a.createdAt).getTime(),
        )
        .slice(0, 5)
        .map((p, i) => ({
          file: p.name,
          action:
            p.updatedAt && p.updatedAt !== p.createdAt
              ? "Project updated"
              : "Project created",
          time: timeAgo(p.updatedAt ?? p.createdAt),
          dotColor: ACTIVITY_COLORS[i % ACTIVITY_COLORS.length] ?? "#534AB7",
        })),
    [projects],
  );

  const formats = ["GLB", "OBJ", "FBX", "IFC", "STEP", "STL"];

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-[#f8f8fc]">
        {/* ── Main ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header
            className="flex items-center justify-between px-6 py-3 bg-white flex-shrink-0"
            style={{
              borderBottom: "1px solid #eef2f7",
              boxShadow: "0 1px 4px rgba(15,23,42,0.03)",
            }}
          >
            {/* Left */}
            <div>
              <p
                className="font-mono text-[9px] tracking-[0.18em] uppercase"
                style={{ color: "#534AB7" }}
              >
                Dashboard · Overview
              </p>

              <h1 className="text-[18px] font-semibold text-[#111827] leading-tight mt-1">
                {greeting}, {firstName} 👋
              </h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg min-w-[240px] bg-[#f8f9fc]"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <Search size={14} className="text-gray-400" />
                <span className="text-[12px] text-gray-400">Search...</span>
              </div>

              {/* Notification */}
              <button
                className="relative w-9 h-9 rounded-lg flex items-center justify-center bg-white"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <Bell size={16} className="text-gray-500" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>

              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
                style={{
                  background: "linear-gradient(135deg,#1a1d35,#534AB7)",
                  color: "#fff",
                }}
              >
                {initials}
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Center */}
            <div
              className="flex-1 overflow-y-auto px-8 py-7 flex flex-col gap-8"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#e5e7eb transparent",
              }}
            >
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  label="Projects"
                  value={totalProjects}
                  delta={
                    totalProjects > 0
                      ? `${totalProjects} active`
                      : "No projects yet"
                  }
                  deltaPositive={totalProjects > 0}
                  icon={<Folder size={14} />}
                  accentColor="#534AB7"
                  iconBg="#EEEDFE"
                />
                <StatCard
                  label="Models"
                  value={totalModels}
                  delta={
                    totalModels > 0
                      ? `Across ${totalProjects} project${totalProjects !== 1 ? "s" : ""}`
                      : "No models yet"
                  }
                  deltaPositive={totalModels > 0}
                  icon={<Box size={14} />}
                  accentColor="#1D9E75"
                  iconBg="#e1f5ee"
                />
                <StatCard
                  label="Storage"
                  value={storageUsedGB}
                  unit="GB"
                  delta={`of 200 GB used (${storagePctVal}%)`}
                  deltaPositive={false}
                  icon={<Database size={14} />}
                  accentColor="#BA7517"
                  iconBg="#faeeda"
                />
                <StatCard
                  label="Collaborators"
                  value={totalCollaborators}
                  delta={
                    totalCollaborators > 0
                      ? "Workspace members"
                      : "No members yet"
                  }
                  deltaPositive={totalCollaborators > 0}
                  icon={<Users size={14} />}
                  accentColor="#378ADD"
                  iconBg="#e6f1fb"
                />
              </div>

              {/* Recent Projects */}
              <div
                className="rounded-3xl bg-white p-6 shadow-sm"
                style={{ border: "1px solid #edf0f5" }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6D63E8]">
                      Workspace
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111827]">
                        Recent Projects
                      </h2>
                      <span className="rounded-full bg-[#EEEDFE] px-3 py-1 text-[11px] font-medium text-[#534AB7]">
                        {totalProjects}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={openProjects}
                    className="group flex items-center gap-1 rounded-xl px-4 py-2 text-[13px] font-medium text-[#534AB7] transition hover:bg-[#EEEDFE]"
                  >
                    View all
                    <ChevronRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {projectsLoading ? (
                    <div className="col-span-full flex min-h-[180px] items-center justify-center rounded-2xl bg-gray-50">
                      Loading projects...
                    </div>
                  ) : dashboardProjects.length === 0 ? (
                    <div className="col-span-full flex min-h-[180px] flex-col items-center justify-center rounded-2xl bg-gray-50">
                      <Folder size={34} className="mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-700">
                        No projects yet
                      </p>
                    </div>
                  ) : (
                    dashboardProjects.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        onView={(e) => {
                          e.stopPropagation();
                          navigate(`/viewer/${p.id}`);
                        }}
                        onOpen={() => navigate(`/projects/${p.id}`)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Activity */}
              <div
                className="rounded-3xl bg-white p-6 shadow-sm"
                style={{ border: "1px solid #edf0f5" }}
              >
                <div className="mb-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6D63E8]">
                    Activity Feed
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111827]">
                      Recent Activity
                    </h2>
                    <span className="rounded-full bg-[#EEEDFE] px-3 py-1 text-[11px] font-medium text-[#534AB7]">
                      {activity.length}
                    </span>
                  </div>
                </div>

                {activity.length === 0 ? (
                  <div className="flex min-h-[160px] items-center justify-center rounded-2xl bg-gray-50">
                    No recent activity
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activity.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-2xl border border-gray-100 px-5 py-4 transition hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{ background: `${a.dotColor}18` }}
                          >
                            <span
                              className="h-[10px] w-[10px] rounded-full"
                              style={{ background: a.dotColor }}
                            />
                          </div>

                          <div>
                            <p className="text-[14px] font-medium text-[#111827]">
                              {a.file}
                            </p>
                            <p className="text-[12px] text-gray-500">
                              {a.action}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-medium text-gray-400">
                          {a.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div
              className="w-[280px] flex-shrink-0 overflow-y-auto px-5 py-7 bg-white"
              style={{
                borderLeft: "1px solid #edf0f5",
              }}
            >
              <div className="mb-8">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Storage Usage
                </p>

                <div className="flex justify-center mb-4">
                  <StorageDonut pct={storagePctVal} />
                </div>

                <p className="text-[13px] text-gray-600 text-center">
                  {storageUsedGB} GB of 200 GB used
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-8">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Quick Upload
                </p>

                <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center hover:border-[#534AB7] hover:bg-[#EEEDFE] transition">
                  <Cloud size={24} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-[13px] text-gray-600">
                    Drop model here or click to browse
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Supported Formats
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {formats.map((f) => (
                    <div
                      key={f}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center text-[12px] font-medium text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7] hover:bg-[#EEEDFE] transition"
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New project modal */}
      <ProjectModal
        isOpen={openModal}
        project={null}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}
