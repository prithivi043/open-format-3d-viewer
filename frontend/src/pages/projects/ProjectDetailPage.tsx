import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Upload, Users, Eye, Trash2, Loader2, FileBox,
  ChevronRight, AlertCircle, RefreshCw, Crown, Pencil, UserCircle,
} from "lucide-react";

import { useProject }        from "../../features/projects/hooks/useProject";
import { useProjectModels }  from "../../features/models/hooks/useProjectModels";
import { useDeleteModel }    from "../../features/models/hooks/useDeleteModel";
import { useProjectMembers } from "../../features/projects/hooks/useProjectMembers";
import { useRemoveMember }   from "../../features/projects/hooks/useInviteMember";
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

// ── sub-components ────────────────────────────────────────────────────────────

function ModelRow({
  model,
  onView,
  onDelete,
  isDeleting,
}: {
  model: Model;
  onView: () => void;
  onDelete: () => void;
  isDeleting: boolean;
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
  member,
  onRemove,
  isRemoving,
}: {
  member: ProjectMemberDetail;
  onRemove: () => void;
  isRemoving: boolean;
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId,    setDeleteTargetId]    = useState<string | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeTargetId,    setRemoveTargetId]    = useState<string | null>(null);

  const openUpload = () => {
    setActiveNav("models");
    navigate(`/models/upload?projectId=${project?.id}`);
  };

  // ── loading / error states ─────────────────────────────────────────────────

  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading project…
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center gap-2 text-red-500">
        <AlertCircle size={20} /> Project not found.
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
    setDeleteTargetId(modelId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteModel = async () => {
    if (!deleteTargetId) return;
    setDeletingModelId(deleteTargetId);
    setDeleteConfirmOpen(false);
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
    } finally {
      setDeletingModelId(null);
      setDeleteTargetId(null);
    }
  };

  const handleRemoveMember = (userId: string) => {
    setRemoveTargetId(userId);
    setRemoveConfirmOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!removeTargetId) return;
    setRemovingMemberId(removeTargetId);
    setRemoveConfirmOpen(false);
    try {
      await removeMutation.mutateAsync(removeTargetId);
    } finally {
      setRemovingMemberId(null);
      setRemoveTargetId(null);
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

            {/* Action buttons — always visible at the top */}
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
              {(["models", "members", "activity", "settings"] as Tab[]).map((tab) => (
                <button key={tab} className={tabCls(tab)} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                  <div className="flex h-64 items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={20} className="animate-spin" /> Loading models…
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
                  <div className="flex h-48 items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={18} className="animate-spin" /> Loading members…
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
              <div className="flex h-48 items-center justify-center gap-2 text-slate-400">
                <Pencil size={18} /> Activity feed coming soon.
              </div>
            )}

            {/* ── Settings tab ────────────────────────────────────────────── */}
            {activeTab === "settings" && (
              <div className="flex h-48 items-center justify-center gap-2 text-slate-400">
                Settings coming soon.
              </div>
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

      {/* Sleek Custom Confirm Modal for Model Deletion */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="text-red-500" size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Delete Model</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete this model? This action cannot be undone.
            </p>
            <div className="flex gap-2.5 mt-5 justify-center">
              <button
                onClick={() => { setDeleteConfirmOpen(false); setDeleteTargetId(null); }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteModel}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Custom Confirm Modal for Member Removal */}
      {removeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Users className="text-red-500" size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Remove Member</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove this member from the project?
            </p>
            <div className="flex gap-2.5 mt-5 justify-center">
              <button
                onClick={() => { setRemoveConfirmOpen(false); setRemoveTargetId(null); }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveMember}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
