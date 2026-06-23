import { useMemo, useState } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useDeleteProject } from "../../features/projects/hooks/useDeleteProject";
import { getProjectImage } from "../../features/projects/utils/getProjectImage";
import ProjectModal from "../../features/projects/components/ProjectModal";
import { useProjects } from "../../features/projects/hooks/useProjects";
import type { Project } from "../../features/projects/types/project.types";

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, isError } = useProjects();
  const deleteMutation = useDeleteProject();

  const ITEMS_PER_PAGE = 6;

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) =>
      project.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [projects, search]);

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

  const handleDelete = (projectId: string) => {
    const confirmed = window.confirm("Delete this project and all models?");
    if (!confirmed) return;

    deleteMutation.mutate(projectId);
    setOpenMenuId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        Loading projects...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center text-red-500">
        Failed to load projects
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f5f7fb] p-8"
      onClick={() => setOpenMenuId(null)}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>

          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search projects..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <FolderOpen className="mx-auto text-slate-400" size={42} />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              No projects found
            </h2>
            <p className="mt-2 text-slate-500">Create your first project.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {paginatedProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="cursor-pointer rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Thumbnail */}
                <img
                  src={getProjectImage(project.name)}
                  alt={project.name}
                  className="h-44 w-full rounded-t-2xl object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null; // prevent infinite loop
                    e.currentTarget.src =
                      "https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg";
                  }}
                />

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {project.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {project.modelCount} Model
                        {project.modelCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === project.id ? null : project.id,
                          );
                        }}
                        className="rounded-md p-1 transition hover:bg-slate-100"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenuId === project.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-10 z-[9999] w-36 rounded-xl border border-slate-200 bg-white shadow-xl"
                        >
                          <button
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50"
                          >
                            <FolderOpen size={14} />
                            Open
                          </button>

                          <button
                            onClick={() => handleEdit(project)}
                            className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(project.id)}
                            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    Updated {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`h-8 w-8 rounded ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-white shadow-sm"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
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
    </div>
  );
}
