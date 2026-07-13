import { useState, useMemo, useRef, type DragEvent } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Folder,
  Box,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Database,
  Users,
  Building2,
  Train,
  Package,
  Cloud,
  ChevronRight,
  UploadCloud,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { useProjects } from "../../features/projects/hooks/useProjects";
import ProjectModal from "../../features/projects/components/ProjectModal";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useUploadModel } from "../../features/models/hooks/useUploadModel";
import { useUploadStore } from "../../features/models/store/uploadStore";
import { useDashboardStats } from "../../features/models/hooks/useDashboardStats";

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

function formatStorage(bytes: number): { value: string; unit: string } {
  if (!bytes || bytes === 0) return { value: "0", unit: "B" };
  if (bytes < 1_024) return { value: bytes.toFixed(0), unit: "B" };
  if (bytes < 1_048_576) return { value: (bytes / 1_024).toFixed(1), unit: "KB" };
  if (bytes < 1_073_741_824) return { value: (bytes / 1_048_576).toFixed(1), unit: "MB" };
  return { value: (bytes / 1_073_741_824).toFixed(2), unit: "GB" };
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
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="bg-white rounded-[10px] overflow-hidden cursor-pointer transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
  const [searchParams] = useSearchParams();
  const showLoginSuccess = searchParams.get("login") === "success";

  const [openModal, setOpenModal] = useState(false);

  // ── Quick Upload state ─────────────────────────────────
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickProjectId, setQuickProjectId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [quickDone, setQuickDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const openProjects = () => navigate("/projects");

  // ── Derived stats ──────────────────────────────────────
  const totalProjects = projects.length;

  // Aggregate real model counts and storage by querying each project's model list.
  // The backend ProjectResponse does not return model_count or storage_bytes,
  // so we must compute these from the actual model records.
  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const {
    totalModels,
    totalStorageBytes,
    isLoading: statsLoading,
  } = useDashboardStats(projectIds);

  const totalCollaborators = useMemo(
    () => projects.reduce((sum, p) => sum + (p.memberCount ?? 1), 0),
    [projects],
  );

  const storageQuotaBytes = useAuthStore((s) => s.storageQuotaBytes);
  const storageQuotaGB = bytesToGB(storageQuotaBytes);
  const storageFormatted = formatStorage(totalStorageBytes);
  const storagePctVal = storagePct(totalStorageBytes, storageQuotaBytes);

  // ── Quick Upload helpers ───────────────────────────────
  // Default to the most recently updated project
  const defaultProjectId = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime(),
      )[0]?.id ?? "",
    [projects],
  );

  const targetProjectId = quickProjectId || defaultProjectId;
  const uploadMutation = useUploadModel(targetProjectId);
  const { progress, isUploading } = useUploadStore();

  const ALLOWED_EXTENSIONS = ["ifc", "glb", "gltf", "fbx", "obj", "step", "stl"];

  const validateQuickFile = (f: File): boolean => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setQuickError("Unsupported format. Use IFC, GLB, GLTF, FBX, OBJ, STEP or STL.");
      return false;
    }
    if (f.size > 500 * 1024 * 1024) {
      setQuickError("File exceeds 500 MB limit.");
      return false;
    }
    setQuickError("");
    return true;
  };

  const handleQuickFile = (f: File) => {
    if (!validateQuickFile(f)) return;
    setQuickFile(f);
    setQuickDone(false);
  };

  const handleQuickDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleQuickFile(f);
  };

  const handleQuickUpload = async () => {
    if (!quickFile || !targetProjectId) return;
    setQuickError("");
    try {
      await uploadMutation.mutateAsync(quickFile);
      setQuickDone(true);
      setQuickFile(null);
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const resetQuickUpload = () => {
    setQuickFile(null);
    setQuickError("");
    setQuickDone(false);
  };

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
            className="flex items-center justify-between px-6 py-2.5 bg-white flex-shrink-0"
            style={{
              borderBottom: "1px solid #eef2f7",
            }}
          >
            {/* Left */}
            <div className="flex flex-col">
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "#534AB7" }}
              >
                Workspace
              </p>

              <h1 className="text-[18px] font-semibold text-[#111827] leading-tight mt-0.5">
                Dashboard
              </h1>
            </div>

            {/* Right */}
            <div
              className="px-3 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: "#f5f3ff",
                color: "#534AB7",
                border: "1px solid #e9e5ff",
              }}
            >
              Active Workspace
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
              {showLoginSuccess && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 flex items-center justify-between shadow-sm flex-shrink-0 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎉</span>
                    <span>
                      <strong>Logged in successfully!</strong> Welcome to your OpenFormat 3D Workspace.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/dashboard", { replace: true });
                    }}
                    className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              )}

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
                  value={statsLoading ? "…" : totalModels}
                  delta={
                    statsLoading
                      ? "Counting models…"
                      : totalModels > 0
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
                  value={statsLoading ? "…" : storageFormatted.value}
                  unit={statsLoading ? "" : storageFormatted.unit}
                  delta={
                    statsLoading
                      ? "Calculating storage…"
                      : `of ${storageQuotaGB} GB used (${storagePctVal}%)`
                  }
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
                    <div className="col-span-full grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-[10px] overflow-hidden animate-pulse" style={{ border: "0.5px solid #e5e7eb" }}>
                          <div className="h-[82px] bg-gray-100" />
                          <div className="px-3 pt-2.5 pb-3 space-y-2">
                            <div className="h-3 w-3/4 rounded-full bg-gray-100" />
                            <div className="h-2 w-1/2 rounded-full bg-gray-100" />
                            <div className="h-2 w-1/3 rounded-full bg-gray-100" />
                          </div>
                        </div>
                      ))}
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
                  {statsLoading ? "Calculating…" : `${storageFormatted.value} ${storageFormatted.unit} of ${storageQuotaGB} GB used`}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-8">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Quick Upload
                </p>

                {projects.length === 0 && !projectsLoading ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center">
                    <Cloud size={22} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-[12px] text-gray-400 mb-3">Create a project first to upload a model.</p>
                    <button
                      onClick={() => setOpenModal(true)}
                      className="text-[12px] font-medium text-[#534AB7] hover:underline"
                    >
                      + New Project
                    </button>
                  </div>
                ) : quickDone ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                    <CheckCircle size={22} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-[12px] text-emerald-700 font-medium mb-3">Upload complete!</p>
                    <button
                      onClick={resetQuickUpload}
                      className="text-[12px] text-[#534AB7] hover:underline font-medium"
                    >
                      Upload another
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Project selector — only shown when >1 project */}
                    {projects.length > 1 && (
                      <select
                        value={targetProjectId}
                        onChange={(e) => setQuickProjectId(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] text-gray-700 focus:border-[#534AB7] focus:outline-none"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleQuickDrop}
                      onClick={() => !quickFile && fileInputRef.current?.click()}
                      className={`rounded-2xl border border-dashed p-5 text-center transition cursor-pointer ${
                        dragActive
                          ? "border-[#534AB7] bg-[#f4f2ff]"
                          : quickFile
                          ? "border-[#534AB7] bg-[#f4f2ff] cursor-default"
                          : "border-gray-300 hover:border-[#534AB7] hover:bg-[#EEEDFE]"
                      }`}
                    >
                      {quickFile ? (
                        <div>
                          <UploadCloud size={20} className="mx-auto mb-1.5 text-[#534AB7]" />
                          <p className="text-[11px] font-medium text-gray-800 truncate max-w-full px-2">
                            {quickFile.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {(quickFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); resetQuickUpload(); }}
                            className="mt-2 inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500"
                          >
                            <XCircle size={11} /> Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Cloud size={22} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-[12px] text-gray-500">Drop model here</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">or click to browse</p>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".ifc,.glb,.gltf,.fbx,.obj,.step,.stl"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQuickFile(f);
                        e.target.value = "";
                      }}
                    />

                    {/* Upload progress bar */}
                    {isUploading && (
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Uploading…</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#534AB7] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {quickError && (
                      <p className="text-[11px] text-red-500">{quickError}</p>
                    )}

                    {/* Upload button */}
                    <button
                      disabled={!quickFile || isUploading || !targetProjectId}
                      onClick={handleQuickUpload}
                      className="w-full rounded-xl bg-[#534AB7] py-2 text-[12px] font-medium text-white disabled:opacity-40 transition hover:bg-[#4338ca]"
                    >
                      {isUploading ? `Uploading… ${progress}%` : "Upload Model"}
                    </button>
                  </div>
                )}
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
