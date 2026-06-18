export type ProjectRole = "viewer" | "editor" | "admin";

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectRole;
}

export interface CreateProjectPayload {
  name: string;
  description: string;
}
