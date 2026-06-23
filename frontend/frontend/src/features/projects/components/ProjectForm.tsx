import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectFormData } from "../schemas/projectSchema";
import { useCreateProject } from "../hooks/useCreateProject";

export default function ProjectForm() {
  const mutation = useCreateProject();

  const { register, handleSubmit } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = (data: ProjectFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input
        {...register("name")}
        placeholder="Project name"
        className="w-full rounded border p-3"
      />

      <textarea
        {...register("description")}
        placeholder="Description"
        className="w-full rounded border p-3"
      />

      <button className="rounded bg-blue-600 px-4 py-2 text-white">
        Create Project
      </button>
    </form>
  );
}
