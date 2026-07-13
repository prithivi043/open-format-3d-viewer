import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Upload, Users, Eye, Trash2, Loader2, FileBox,
  ChevronRight, AlertCircle, RefreshCw, Crown, Pencil,
  UserCircle, Activity, Settings, Save, Folder, Clock,
  FileUp, UserPlus, CheckCircle, XCircle,
} from "lucide-react";

import { useProject }        from "../../features/projects/hooks/useProject";
import { useProjectModels }  from "../../features/models/hooks/useProjectModels";
import { useDeleteModel }    from "../../features/models/hooks/useDeleteModel";
import { useProjectMembers } from "../../features/projects/hooks/useProjectMembers";
import { useRemoveMember }   from "../../features/projects/hooks/useInviteMember";
import { useUpdateProject }  from "../../features/projects/hooks/useUpdateProject";
import { useDeleteProject }  from "../../features/projects/hooks/useDeleteProject";
import InviteMemberModal     from "../../features/projects/components/InviteMemberModal";
import { useLayoutStore }    from "../../stores/layoutStore";
import type { Model }        from "../../features/models/types/model.types";
import type { ProjectMemberDetail, ProjectRole } from "../../features/projects/types/project.types";

type Tab = "models" | "members" | "activity" | "settings";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

function fileExt(filename: string) {
  return filename.split(".").pop()?.toUpperCase() ?? "—";
}

const STATUS_STYLE: Record<string, string> = {
  ready:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  processing: "bg-amber-50  text-amber-700  border-amber-200",
  uploading:  "bg-blue-50   text-blue-700   border-blue-200",
  failed:     "bg-red-50    text-red-600    border-red-200",
};

const ROLE_STYLE: Record<ProjectRole, string> = {
  admin:  "bg-purple-50 text-purple-700 border-purple-200",
  editor: "bg-blue-50   text-blue-700   border-blue-200",
  viewer: "bg-slate-50  text-slate-600  border-slate-200",
};

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", danger = false,
  onConfirm, onCancel, isLoading = false,
}: {
  open: boolean; title: string; message: string;
  confirmLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void; isLoading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
          <AlertCircle className={danger ? "text-red-500" : "text-amber-500"} size={24} />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-2">{message}</p>
        <div className="flex gap-2.5 mt-5 justify-center">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-4 py-2 text-xs font-medium text-white flex items-center gap-1.5 disabled:opacity-60 transition ${danger ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}
          >
            {isLoading && <Loader2 size={11} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function ModelRow({
  model, onView, onDelete, isDeleting,
}: {
  model: Model; onView: () => void; onDelete: () => void; isDeleting: boolean;
}) {
  return (
    <tr className="group hover:bg-slate-50 transition">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FileBox size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 max-w-[200px] truncate">
              {model.filename}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{model.id.slice(0, 12)}…</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {fileExt(model.filename)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600">{formatBytes(model.size_bytes)}</td>
      <td className="px-4 py-3.5 text-sm text-slate-500">{formatDate(model.created_at)}</td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[model.status] ?? STATUS_STYLE["ready"]}`}
        >
          {model.status}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={onView}
            title="View in 3D"
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
          >
            <Eye size={12} /> View
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            title="Delete model"
            className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 transition"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

function MemberRow({
  member, onRemove, isRemoving,
}: {
  member: ProjectMemberDetail; onRemove: () => void; isRemoving: boolean;
}) {
  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <tr className="group hover:bg-slate-50 transition">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: member.avatarColor }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{member.fullName}</p>
            <p className="text-xs text-slate-400">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLE[member.role]}`}
        >
          {member.role === "admin" && <Crown size={10} />}
          {member.role}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-500">{formatDate(member.joinedAt)}</td>
      <td className="px-4 py-3.5">
        {member.role !== "admin" && (
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 transition"
          >
            {isRemoving ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Remove
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────
function ActivityTab({
  models, members, project,
}: {
  models: Model[];
  members: ProjectMemberDetail[];
  project: { name: string; createdAt: string; updatedAt?: string; modelCount: number; memberCount: number };
}) {
  type ActivityEvent = {
    id: string;
    icon: React.ReactNode;
    color: string;
    title: string;
    description: string;
    time: string;
  };

  // Derive activity events from real API data
  const events: ActivityEvent[] = [];

  // Project creation event
  events.push({
    id: "project-created",
    icon: <Folder size={14} />,
    color: "#534AB7",
    title: "Project created",
    description: `"${project.name}" was created`,
    time: project.createdAt,
  });

  // Model upload events
  models.forEach((m) => {
    events.push({
      id: `model-${m.id}`,
      icon: <FileUp size={14} />,
      color: "#1D9E75",
      title: "Model uploaded",
      description: `${m.filename} (${fileExt(m.filename)}, ${formatBytes(m.size_bytes)})`,
      time: m.created_at,
    });
  });

  // Member join events
  members.forEach((m) => {
    events.push({
      id: `member-${m.userId}`,
      icon: <UserPlus size={14} />,
      color: "#378ADD",
      title: "Member joined",
      description: `${m.fullName} joined as ${m.role}`,
      time: m.joinedAt,
    });
  });

  // Project updated event (if different from created)
  if (project.updatedAt && project.updatedAt !== project.createdAt) {
    events.push({
      id: "project-updated",
      icon: <Pencil size={14} />,
      color: "#BA7517",
      title: "Project updated",
      description: `"${project.name}" settings were updated`,
      time: project.updatedAt,
    });
  }

  // Sort by time descending
  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  if (events.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
        <Activity size={40} />
        <p className="text-sm">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />

        <div className="space-y-0">
          {events.map((ev, i) => (
            <div key={ev.id} className={`relative flex items-start gap-4 ${i > 0 ? "mt-5" : ""}`}>
              {/* Dot */}
              <div
                className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white"
                style={{ background: ev.color }}
              >
                {ev.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{ev.title}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                    <Clock size={11} />
                    {timeAgo(ev.time)}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{ev.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({
  project,
  onProjectDeleted,
}: {
  project: { id: string; name: string; description: string };
  onProjectDeleted: () => void;
}) {
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [name, setName]             = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [saveSuccess, setSaveSuccess]  = useState(false);
  const [saveError, setSaveError]      = useState("");
  const [deleteOpen, setDeleteOpen]    = useState(false);
  const [confirmName, setConfirmName]  = useState("");

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateMutation.mutateAsync({
        projectId: project.id,
        data: { name: name.trim(), description: description.trim() },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(project.id);
      onProjectDeleted();
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  const canDelete = confirmName.trim().toLowerCase() === project.name.trim().toLowerCase();

  return (
    <div className="px-6 py-5 space-y-8 max-w-2xl">
      {/* General Settings */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Settings size={15} className="text-slate-400" /> General
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              placeholder="Project name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
              placeholder="Describe this project…"
            />
          </div>

          {saveError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
              <XCircle size={15} /> {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
              <CheckCircle size={15} /> Changes saved successfully.
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || (!name.trim())}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {updateMutation.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h3 className="text-sm font-semibold text-red-600 mb-4 flex items-center gap-2">
          <AlertCircle size={15} /> Danger Zone
        </h3>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-red-800">Delete this project</p>
              <p className="text-xs text-red-600 mt-1">
                This will permanently delete the project and all its models. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setDeleteOpen(true)}
              className="shrink-0 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition"
            >
              Delete Project
            </button>
          </div>
        </div>
      </section>

      {/* Delete Project Confirm Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="text-red-500" size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 text-center">Delete "{project.name}"?</h3>
            <p className="text-xs text-slate-500 text-center mt-2">
              All models, annotations, and member data will be permanently deleted. This cannot be undone.
            </p>

            <div className="mt-5">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Type <span className="font-bold text-slate-800">{project.name}</span> to confirm:
              </label>
              <input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-red-400 transition"
                placeholder={project.name}
              />
            </div>

            <div className="flex gap-2.5 mt-5 justify-center">
              <button
                onClick={() => { setDeleteOpen(false); setConfirmName(""); }}
                disabled={deleteMutation.isPending}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canDelete || deleteMutation.isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {deleteMutation.isPending && <Loader2 size={11} className="animate-spin" />}
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { setActiveNav } = useLayoutStore();

  const { data: project, isLoading: isLoadingProject, isError } = useProject(id ?? "");
  const { data: models,  isLoading: isLoadingModels,  refetch: refetchModels } = useProjectModels(id ?? "");
  const { data: members, isLoading: isLoadingMembers } = useProjectMembers(id ?? "");

  const deleteMutation = useDeleteModel(id ?? "");
  const removeMutation = useRemoveMember(id ?? "");

  const [activeTab,        setActiveTab]        = useState<Tab>("models");
  const [inviteOpen,       setInviteOpen]       = useState(false);
  const [deletingModelId,  setDeletingModelId]  = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [deleteModelConfirmOpen, setDeleteModelConfirmOpen] = useState(false);
  const [deleteModelTargetId,    setDeleteModelTargetId]    = useState<string | null>(null);
  const [removeMemberConfirmOpen, setRemoveMemberConfirmOpen] = useState(false);
  const [removeMemberTargetId,    setRemoveMemberTargetId]    = useState<string | null>(null);

  const openUpload = () => {
    setActiveNav("models");
    navigate(`/models/upload?projectId=${project?.id}`);
  };

  // ── loading / error states ─────────────────────────────────────────────────

  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm">Loading project…</p>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex flex-col items-center justify-center gap-3 text-red-500">
        <AlertCircle size={40} />
        <p className="font-medium">Project not found.</p>
        <button onClick={() => navigate("/projects")} className="text-sm text-blue-600 hover:underline">
          Back to Projects
        </button>
      </div>
    );
  }

  const tabCls = (tab: Tab) =>
    `px-4 py-3 text-sm font-medium border-b-2 transition ${
      activeTab === tab
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-slate-500 hover:text-slate-800"
    }`;

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleDeleteModel = (modelId: string) => {
    setDeleteModelTargetId(modelId);
    setDeleteModelConfirmOpen(true);
  };

  const confirmDeleteModel = async () => {
    if (!deleteModelTargetId) return;
    setDeletingModelId(deleteModelTargetId);
    setDeleteModelConfirmOpen(false);
    try {
      await deleteMutation.mutateAsync(deleteModelTargetId);
    } finally {
      setDeletingModelId(null);
      setDeleteModelTargetId(null);
    }
  };

  const handleRemoveMember = (userId: string) => {
    setRemoveMemberTargetId(userId);
    setRemoveMemberConfirmOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!removeMemberTargetId) return;
    setRemovingMemberId(removeMemberTargetId);
    setRemoveMemberConfirmOpen(false);
    try {
      await removeMutation.mutateAsync(removeMemberTargetId);
    } finally {
      setRemovingMemberId(null);
      setRemoveMemberTargetId(null);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-[#f5f7fb] p-8">
        <div className="mx-auto max-w-7xl">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link to="/projects" className="hover:text-blue-600 transition">Projects</Link>
            <ChevronRight size={14} />
            <span className="text-slate-700 font-medium">{project.name}</span>
          </div>

          {/* Header */}
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
              <p className="mt-2 text-slate-500 max-w-xl">
                {project.description || "No description"}
              </p>

              {/* meta pills */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-500">
                  <FileBox size={12} /> {project.modelCount} model{project.modelCount !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-500">
                  <Users size={12} /> {project.memberCount} member{project.memberCount !== 1 ? "s" : ""}
                </span>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  project.status === "Ready" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  project.status === "Processing" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-slate-50 text-slate-600 border-slate-200"
                }`}>
                  {project.status}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <Users size={15} /> Invite Members
              </button>
              <button
                onClick={openUpload}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm"
              >
                <Upload size={15} /> Upload Model
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b border-slate-200 bg-white rounded-t-xl px-4">
            <div className="flex gap-1">
              {([
                { key: "models",   label: "Models",   icon: <FileBox size={14} /> },
                { key: "members",  label: "Members",  icon: <Users size={14} /> },
                { key: "activity", label: "Activity", icon: <Activity size={14} /> },
                { key: "settings", label: "Settings", icon: <Settings size={14} /> },
              ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
                <button key={key} className={tabCls(key)} onClick={() => setActiveTab(key)}>
                  <span className="flex items-center gap-1.5">{icon}{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="rounded-b-xl bg-white shadow-sm min-h-[500px]">

            {/* ── Models tab ──────────────────────────────────────────────── */}
            {activeTab === "models" && (
              <div>
                {isLoadingModels ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
                    <p className="text-sm">Loading models…</p>
                  </div>
                ) : models && models.length > 0 ? (
                  <div>
                    {/* Table header bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                      <p className="text-sm text-slate-500">
                        {models.length} model{models.length !== 1 ? "s" : ""} · {formatBytes(project.storageBytes)} used
                      </p>
                      <button
                        onClick={() => refetchModels()}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition"
                      >
                        <RefreshCw size={12} /> Refresh
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            {["Model Name", "Type", "Size", "Uploaded", "Status", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {models.map((model) => (
                            <ModelRow
                              key={model.id}
                              model={model}
                              onView={() => navigate(`/viewer/${model.id}`)}
                              onDelete={() => handleDeleteModel(model.id)}
                              isDeleting={deletingModelId === model.id}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="flex h-[380px] flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
                      <Upload size={36} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">No models uploaded yet</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-sm">
                      Upload an IFC, GLB, or GLTF model to start collaborating with your team.
                    </p>
                    <button
                      onClick={openUpload}
                      className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
                    >
                      <Upload size={15} /> Upload your first model
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Members tab ─────────────────────────────────────────────── */}
            {activeTab === "members" && (
              <div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <p className="text-sm text-slate-500">
                    {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => setInviteOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                  >
                    <Users size={14} /> Invite
                  </button>
                </div>

                {isLoadingMembers ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
                    <p className="text-sm">Loading members…</p>
                  </div>
                ) : members && members.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {["Member", "Role", "Joined", ""].map((h, i) => (
                            <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {members.map((member) => (
                          <MemberRow
                            key={member.id}
                            member={member}
                            onRemove={() => handleRemoveMember(member.userId)}
                            isRemoving={removingMemberId === member.userId}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
                    <UserCircle size={40} />
                    <p className="text-sm">No members yet. Invite your team!</p>
                    <button
                      onClick={() => setInviteOpen(true)}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                    >
                      <Users size={14} /> Invite member
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Activity tab ────────────────────────────────────────────── */}
            {activeTab === "activity" && (
              <ActivityTab
                models={models ?? []}
                members={members ?? []}
                project={project}
              />
            )}

            {/* ── Settings tab ────────────────────────────────────────────── */}
            {activeTab === "settings" && (
              <SettingsTab
                project={project}
                onProjectDeleted={() => navigate("/projects")}
              />
            )}
          </div>
        </div>
      </div>

      {/* Invite modal */}
      <InviteMemberModal
        projectId={project.id}
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />

      {/* Model Delete Confirm */}
      <ConfirmDialog
        open={deleteModelConfirmOpen}
        title="Delete Model"
        message="Are you sure you want to delete this model? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteModel}
        onCancel={() => { setDeleteModelConfirmOpen(false); setDeleteModelTargetId(null); }}
        isLoading={!!deletingModelId}
      />

      {/* Member Remove Confirm */}
      <ConfirmDialog
        open={removeMemberConfirmOpen}
        title="Remove Member"
        message="Are you sure you want to remove this member from the project?"
        confirmLabel="Remove"
        danger
        onConfirm={confirmRemoveMember}
        onCancel={() => { setRemoveMemberConfirmOpen(false); setRemoveMemberTargetId(null); }}
        isLoading={!!removingMemberId}
      />
    </>
  );
}
