export type ProjectRole = "viewer" | "editor" | "admin";
export type ProjectStatus = "Draft" | "Ready" | "Processing";

// ── Member detail (full info returned by the API) ────────────────────────────
export interface ProjectMemberDetail {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  fullName: string;
  role: ProjectRole;
  joinedAt: string;
  /** Hex color used for the avatar in the viewer / member list */
  avatarColor: string;
}

export interface InviteMemberPayload {
  email: string;
  role: ProjectRole;
}

export interface ProjectDTO {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at?: string;
  model_count?: number;
  member_count?: number;
  storage_bytes?: number;
  status?: ProjectStatus;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  modelCount: number;
  memberCount: number;
  storageBytes: number;
  status: ProjectStatus;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
}

export interface CreateProjectPayload {
  name: string;
  description: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}
