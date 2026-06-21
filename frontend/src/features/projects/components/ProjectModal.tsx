import { useEffect } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { projectSchema, type ProjectFormData } from "../schemas/projectSchema";

import { useCreateProject } from "../hooks/useCreateProject";
import { useUpdateProject } from "../hooks/useUpdateProject";
import type { Project } from "../types/project.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function ProjectModal({ isOpen, onClose, project }: Props) {
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description,
      });
    } else {
      reset({
        name: "",
        description: "",
      });
    }
  }, [project, reset]);

  const onSubmit = (data: ProjectFormData) => {
    if (project) {
      updateMutation.mutate({
        projectId: project.id,
        data,
      });
    } else {
      createMutation.mutate(data);
    }

    onClose();
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {project ? "Edit Project" : "Create Project"}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Project Name
            </label>

            <input
              {...register("name")}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-cyan-400"
              placeholder="Project Name"
            />

            {errors.name && (
              <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Description
            </label>

            <textarea
              {...register("description")}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-cyan-400"
              placeholder="Project Description"
            />

            {errors.description && (
              <p className="mt-2 text-sm text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-slate-300"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-cyan-500 px-5 py-2 font-medium text-white disabled:opacity-50"
            >
              {isLoading ? "Processing..." : project ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
