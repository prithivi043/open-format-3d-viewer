import { useMemo, useState, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  FolderX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useDeleteProject } from "../../features/projects/hooks/useDeleteProject";
import { getProjectImage } from "../../features/projects/utils/getProjectImage";
import ProjectModal from "../../features/projects/components/ProjectModal";
import { useProjects } from "../../features/projects/hooks/useProjects";
import { useProjectModelSummaries } from "../../features/models/hooks/useProjectModelSummaries";
import type { Project } from "../../features/projects/types/project.types";

// ── Custom Confirm Dialog ──────────────────────────────────────────────────────
function ConfirmDeleteModal({
  project,
  onConfirm,
  onCancel,
  isLoading,
}: {
  project: Project | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  if (!project) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="text-red-500" size={24} />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Delete Project?</h3>
        <p className="text-sm text-slate-600 mt-1 font-medium truncate px-2">"{project.name}"</p>
        <p className="text-xs text-slate-500 mt-2">
          All models and data associated with this project will be permanently deleted. This action
          cannot be undone.
        </p>
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
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 transition flex items-center gap-1.5"
          >
            {isLoading && <Loader2 size={11} className="animate-spin" />}
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project List Page ──────────────────────────────────────────────────────────
export default function ProjectListPage() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, isError, refetch } = useProjects();
  const deleteMutation = useDeleteProject();

  const ITEMS_PER_PAGE = 6;

  const [editingProject,  setEditingProject]  = useState<Project | null>(null);
  const [deleteTarget,    setDeleteTarget]    = useState<Project | null>(null);
  const [openMenuId,      setOpenMenuId]      = useState<string | null>(null);
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [search,          setSearch]          = useState("");
  const [currentPage,     setCurrentPage]     = useState(1);

  // Fetch per-project model summaries (count + latest upload date) in parallel.
  // The backend never returns model_count in ProjectResponse, so we derive it
  // from the actual model records for each project.
  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const modelSummaries = useProjectModelSummaries(projectIds);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const handleDocumentClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [openMenuId]);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [search]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteRequest = (project: Project) => {
    setDeleteTarget(project);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setDeleteTarget(null),
    });
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm font-medium">Loading projects…</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex flex-col items-center justify-center gap-4 text-slate-500">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-800">Failed to load projects</p>
          <p className="text-sm text-slate-500 mt-1">Check your connection and try again.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
            <p className="text-sm text-slate-500 mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""} in your workspace
            </p>
          </div>

          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
        </div>

        {/* Empty State — no projects at all */}
        {projects.length === 0 ? (
          <div className="rounded-2xl bg-white p-16 text-center shadow-sm border border-slate-100">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <FolderOpen className="text-slate-400" size={36} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">No projects yet</h2>
            <p className="mt-2 text-slate-500 max-w-sm mx-auto">
              Create your first project to start uploading 3D models and collaborating with your team.
            </p>
            <button
              onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Create First Project
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State — no search results */
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FolderX className="text-slate-400" size={28} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">No results for "{search}"</h2>
            <p className="mt-2 text-slate-500 text-sm">Try a different search term.</p>
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {paginatedProjects.map((project) => (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/projects/${project.id}`);
                    }
                  }}
                  className="cursor-pointer rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-100"
                >
                  {/* Thumbnail */}
                  <img
                    src={getProjectImage(project.name)}
                    alt={project.name}
                    className="h-44 w-full rounded-t-2xl object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg";
                    }}
                  />

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-slate-900 truncate">{project.name}</h2>
                        <p className="mt-1 text-sm text-slate-500 truncate">
                          {project.description || "No description"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {(() => {
                            const s = modelSummaries.get(project.id);
                            if (!s || s.isLoading) return <span className="inline-block h-3 w-16 rounded bg-slate-100 animate-pulse" />;
                            return s.modelCount === 0 ? "No models yet" : `${s.modelCount} Model${s.modelCount !== 1 ? "s" : ""}`;
                          })()}
                        </p>
                      </div>

                      <div className="relative ml-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === project.id ? null : project.id);
                          }}
                          aria-label="More options"
                          className="rounded-md p-1 transition hover:bg-slate-100"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openMenuId === project.id && (
                          <div
                            className="absolute right-0 top-10 z-[9999] w-36 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => navigate(`/projects/${project.id}`)}
                              className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50 transition"
                            >
                              <FolderOpen size={14} /> Open
                            </button>

                            <button
                              onClick={() => handleEdit(project)}
                              className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50 transition"
                            >
                              <Pencil size={14} /> Edit
                            </button>

                            <div className="border-t border-slate-100" />

                            <button
                              onClick={() => handleDeleteRequest(project)}
                              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        {(() => {
                          const s = modelSummaries.get(project.id);
                          // If we have a latest model upload date, show that;
                          // otherwise fall back to the project's own updated_at.
                          const displayDate = (s && !s.isLoading && s.latestModelDate)
                            ? s.latestModelDate
                            : (project.updatedAt ?? project.createdAt);
                          return `Updated ${new Date(displayDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                        })()}
                      </p>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                          project.status === "Ready"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : project.status === "Processing"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`h-9 w-9 rounded-xl text-sm font-medium transition ${
                      currentPage === i + 1
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <ProjectModal
          isOpen={isModalOpen}
          project={editingProject}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProject(null);
          }}
        />
      </div>

      {/* Custom Delete Confirm Modal */}
      <ConfirmDeleteModal
        project={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
