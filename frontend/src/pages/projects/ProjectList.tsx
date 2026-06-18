import ProjectForm from "../../features/projects/components/ProjectForm";
import ProjectCard from "../../features/projects/components/ProjectCard";
import { useProjects } from "../../features/projects/hooks/useProjects";
import type { Project } from "../../features/projects/types/project.types";

export default function ProjectList() {
  const { data = [], isLoading, error } = useProjects();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Failed to load projects</p>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>

      <div className="bg-white rounded-xl p-6 shadow mb-8">
        <ProjectForm />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {data.map((project: Project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
