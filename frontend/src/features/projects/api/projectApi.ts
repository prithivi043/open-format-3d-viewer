import { apiClient } from "../../../lib/apiClient";
import type { Project, CreateProjectPayload } from "../types/project.types";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/projects`;

export async function getProjects(): Promise<Project[]> {
  return apiClient<Project[]>(BASE);
}

export async function createProject(
  data: CreateProjectPayload,
): Promise<Project> {
  return apiClient<Project>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
