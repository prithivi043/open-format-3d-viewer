import { apiClient } from "../../../lib/apiClient";
import type {
  Project,
  ProjectDTO,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectMemberDetail,
  InviteMemberPayload,
} from "../types/project.types";

const BASE = "/projects";

function mapProject(dto: ProjectDTO): Project {
  return {
    id: dto.id,
    ownerId: dto.owner_id,
    name: dto.name,
    description: dto.description,
    createdAt: dto.created_at,
    ...(dto.updated_at ? { updatedAt: dto.updated_at } : {}),
    modelCount: dto.model_count ?? 0,
    memberCount: dto.member_count ?? 1,
    storageBytes: dto.storage_bytes ?? 0,
    status: dto.status ?? "Draft",
  };
}

export async function getProjects(): Promise<Project[]> {
  const res = await apiClient<ProjectDTO[]>(BASE);
  return res.map(mapProject);
}

export async function getProject(projectId: string): Promise<Project> {
  const res = await apiClient<ProjectDTO>(`${BASE}/${projectId}`);
  return mapProject(res);
}

export async function createProject(
  data: CreateProjectPayload,
): Promise<Project> {
  const res = await apiClient<ProjectDTO>(BASE, {
    method: "POST",
    body: data,
  });
  return mapProject(res);
}

export async function updateProject(
  projectId: string,
  data: UpdateProjectPayload,
): Promise<Project> {
  const res = await apiClient<ProjectDTO>(`${BASE}/${projectId}`, {
    method: "PATCH",
    body: data,
  });
  return mapProject(res);
}

export async function deleteProject(projectId: string): Promise<void> {
  return apiClient<void>(`${BASE}/${projectId}`, {
    method: "DELETE",
  });
}

// ── Member management ─────────────────────────────────────────────────────────

export async function getProjectMembers(
  projectId: string,
): Promise<ProjectMemberDetail[]> {
  return apiClient<ProjectMemberDetail[]>(`${BASE}/${projectId}/members`);
}

export async function inviteProjectMember(
  projectId: string,
  payload: InviteMemberPayload,
): Promise<ProjectMemberDetail> {
  return apiClient<ProjectMemberDetail>(`${BASE}/${projectId}/members`, {
    method: "POST",
    body: payload,
  });
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  return apiClient<void>(`${BASE}/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}
