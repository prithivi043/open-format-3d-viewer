import type { Project } from "../types/project.types";

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{project.name}</h3>

      <p className="text-gray-500 mt-2">{project.description}</p>

      <p className="text-sm text-gray-400 mt-4">
        {new Date(project.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
