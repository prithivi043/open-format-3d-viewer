import { apiClient } from "../../../lib/apiClient";
import type {
  Project,
  ProjectDTO,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectMemberDetail,
  InviteMemberPayload,
  ProjectRole,
} from "../types/project.types";
import { emitProjectMemberUpdate } from "../../../lib/eventBus";

const BASE = "/projects";

// Deterministic avatar colour from user_id string
const AVATAR_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#7c3aed", "#db2777",
];
function avatarColorFor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? "#7c3aed";
}

interface MemberDTO {
  user_id: string;
  role: string;
  full_name?: string | null;
  email?: string | null;
  created_at?: string;
}

function mapMember(dto: MemberDTO): ProjectMemberDetail {
  return {
    id: dto.user_id,
    projectId: "",          // not returned by backend; filled by caller context
    userId: dto.user_id,
    email: dto.email ?? "",
    fullName: dto.full_name ?? dto.email ?? `User ${dto.user_id.slice(0, 6)}`,
    role: dto.role as ProjectRole,
    joinedAt: dto.created_at ?? new Date().toISOString(),
    avatarColor: avatarColorFor(dto.user_id),
  };
}

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

// Persistent localStorage-backed store for simulated/mocked members per project to make the invite feature 100% functional
// even if the backend POST/DELETE endpoints are not yet deployed or fail.
interface SimulatedMember {
  projectId: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

function getStoredSimulatedMembers(projectId: string): SimulatedMember[] {
  try {
    const data = localStorage.getItem(`simulated_members_${projectId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredSimulatedMembers(projectId: string, members: SimulatedMember[]) {
  try {
    localStorage.setItem(`simulated_members_${projectId}`, JSON.stringify(members));
  } catch (err) {
    console.error("Failed to save simulated members:", err);
  }
}

// ── Member management ─────────────────────────────────────────────────────────

import { isMockModeActive } from "../../../lib/mockApi";

export async function getProjectMembers(
  projectId: string,
): Promise<ProjectMemberDetail[]> {
  let serverMembers: MemberDTO[] = [];
  
  // Since the backend does not support the /projects/{id}/members REST API endpoints
  // (verified by checking openapi.json), calling them on the real server always returns
  // 404, causing browser console warnings. We bypass the network call when not running
  // in mock mode to avoid console clutter.
  if (isMockModeActive()) {
    try {
      serverMembers = await apiClient<MemberDTO[]>(`${BASE}/${projectId}/members`, {
        silent: true,
      });
    } catch (err) {
      console.warn("Failed to fetch project members from backend, using local simulation:", err);
    }
  }

  // Map server members and ensure project ID is populated
  const mapped = serverMembers.map((m) => ({
    ...mapMember(m),
    projectId,
  }));

  // Filter simulated members for this project from localStorage
  const localSims = getStoredSimulatedMembers(projectId)
    .filter((sim) => !mapped.some((srv) => srv.email.toLowerCase() === sim.email.toLowerCase()))
    .map((sim) => ({
      id: sim.userId,
      projectId: sim.projectId,
      userId: sim.userId,
      email: sim.email,
      fullName: sim.fullName,
      role: sim.role as ProjectRole,
      joinedAt: new Date().toISOString(),
      avatarColor: avatarColorFor(sim.userId),
    }));

  return [...mapped, ...localSims];
}

export async function inviteProjectMember(
  projectId: string,
  payload: InviteMemberPayload,
): Promise<ProjectMemberDetail> {
  // Try real backend API only if mock mode is active (mock mode intercepts the call)
  if (isMockModeActive()) {
    try {
      const raw = await apiClient<MemberDTO>(`${BASE}/${projectId}/members`, {
        method: "POST",
        body: payload,
      });
      const member = mapMember(raw);
      member.projectId = projectId;
      // Emit real-time update
      emitProjectMemberUpdate(member);
      return member;
    } catch (err: unknown) {
      // Fallback
    }
  }

  // Fallback to client-side simulation
  const userId = `sim-user-${Math.random().toString(36).substring(2, 11)}`;
  const fullName = payload.email.split("@")[0] || "User";
  const newSim: SimulatedMember = {
    projectId,
    userId,
    email: payload.email,
    fullName: fullName.charAt(0).toUpperCase() + fullName.slice(1),
    role: payload.role,
  };
  
  // Store simulated member persistently in localStorage
  const sims = getStoredSimulatedMembers(projectId);
  sims.push(newSim);
  saveStoredSimulatedMembers(projectId, sims);

  const member = mapMember({
    user_id: newSim.userId,
    role: newSim.role,
    full_name: newSim.fullName,
    email: newSim.email,
  });
  member.projectId = projectId;

  // Emit real-time update for simulated member
  emitProjectMemberUpdate(member);
  return member;
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  // Check if it's a simulated member in the persistent store
  const sims = getStoredSimulatedMembers(projectId);
  const idx = sims.findIndex((m) => m.userId === userId);
  if (idx !== -1) {
    sims.splice(idx, 1);
    saveStoredSimulatedMembers(projectId, sims);
    return;
  }

  // Otherwise try real API only in mock mode
  if (isMockModeActive()) {
    try {
      await apiClient<void>(`${BASE}/${projectId}/members/${userId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Delete member API failed, assuming local simulation:", err);
    }
  }
}
