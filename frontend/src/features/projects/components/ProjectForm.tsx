import { useForm } from "react-hook-form";
import { useCreateProject } from "../hooks/useCreateProject";

type FormData = {
  name: string;
  description: string;
};

export default function ProjectForm() {
  const mutation = useCreateProject();

  const { register, handleSubmit } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input
        {...register("name")}
        placeholder="Project Name"
        className="w-full border p-3 rounded"
      />

      <textarea
        {...register("description")}
        placeholder="Description"
        className="w-full border p-3 rounded"
      />

      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Create Project
      </button>
    </form>
  );
}
