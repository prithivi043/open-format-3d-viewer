import { useNavigate } from "react-router-dom";
import type { Project } from "../types/project.types";

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="cursor-pointer rounded-xl border bg-white p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold">{project.name}</h3>

      <p className="mt-2 text-sm text-gray-500">{project.description}</p>
    </div>
  );
}
