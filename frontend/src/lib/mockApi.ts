// src/lib/mockApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// Mock API layer: simulates backend responses using localStorage.
// Switching to the real backend requires NO changes to any UI component –
// just set VITE_USE_MOCK=false and point VITE_API_BASE_URL to the real server.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CURRENT_USER_KEY = "mock_current_user";
const MOCK_USERS_KEY = "mock_users";
const MOCK_PROJECTS_KEY = "mock_projects";

const AVATAR_PALETTE = [
  "#7c3aed", "#0891b2", "#059669", "#d97706",
  "#db2777", "#2563eb", "#9333ea", "#16a34a",
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Mode helpers ─────────────────────────────────────────────────────────────

export function isMockModeActive(): boolean {
  return import.meta.env.VITE_LOCAL_MODEL_MODE === "true" || localStorage.getItem("use_mock_api") === "true";
}

export function setMockMode(active: boolean) {
  if (active) {
    localStorage.setItem("use_mock_api", "true");
  } else {
    localStorage.removeItem("use_mock_api");
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
  }
}

// ── Typed interfaces ─────────────────────────────────────────────────────────

interface MockUser {
  id: string;
  email: string;
  full_name: string;
}

interface MockProject {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at?: string;
  model_count: number;
  member_count: number;
  storage_bytes: number;
  status: "Draft" | "Ready" | "Processing";
}

interface MockModel {
  id: string;
  project_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  status: "uploading" | "processing" | "ready" | "failed";
  created_at: string;
}

interface MockMember {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  fullName: string;
  role: "viewer" | "editor" | "admin";
  joinedAt: string;
  avatarColor: string;
}

// ── Storage helpers ──────────────────────────────────────────────────────────

function getMockUsers(): MockUser[] {
  try { return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]"); }
  catch { return []; }
}

function saveMockUsers(users: MockUser[]) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function getMockProjects(): MockProject[] {
  try {
    const stored = localStorage.getItem(MOCK_PROJECTS_KEY);
    if (!stored) {
      const defaults: MockProject[] = [
        {
          id: "proj-1",
          owner_id: "mock-user-id",
          name: "Residential Villa Project",
          description: "A 3D BIM model of a two-story residential villa.",
          created_at: new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
          model_count: 1,
          member_count: 3,
          storage_bytes: 45 * 1024 * 1024,
          status: "Ready",
        },
        {
          id: "proj-2",
          owner_id: "mock-user-id",
          name: "Office Tower Concept",
          description: "Schematic design for a high-rise office building.",
          created_at: new Date(Date.now() - 2 * 24 * 3600_000).toISOString(),
          model_count: 0,
          member_count: 1,
          storage_bytes: 0,
          status: "Draft",
        },
      ];
      localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(stored);
  } catch { return []; }
}

function saveMockProjects(projects: MockProject[]) {
  localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));
}

function getMockModelsForProject(projectId: string): MockModel[] {
  const models: MockModel[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("mock_model_")) {
      try {
        const m: MockModel = JSON.parse(localStorage.getItem(key) || "{}");
        if (m.project_id === projectId) models.push(m);
      } catch { /* skip */ }
    }
  }
  // Sort newest first
  models.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return models;
}

function getMockMembers(projectId: string): MockMember[] {
  try {
    return JSON.parse(localStorage.getItem(`mock_members_${projectId}`) || "[]");
  } catch { return []; }
}

function saveMockMembers(projectId: string, members: MockMember[]) {
  localStorage.setItem(`mock_members_${projectId}`, JSON.stringify(members));
}

function ensureOwnerMember(projectId: string) {
  const members = getMockMembers(projectId);
  const currentUser: MockUser | null = (() => {
    try { return JSON.parse(localStorage.getItem(MOCK_CURRENT_USER_KEY) || "null"); }
    catch { return null; }
  })();
  if (!currentUser) return;
  const alreadyThere = members.some((m) => m.userId === currentUser.id);
  if (!alreadyThere) {
    members.unshift({
      id: "member-owner-" + projectId,
      projectId,
      userId: currentUser.id,
      email: currentUser.email,
      fullName: currentUser.full_name,
      role: "admin",
      joinedAt: new Date().toISOString(),
      avatarColor: AVATAR_PALETTE[0] || "#7c3aed",
    });
    saveMockMembers(projectId, members);
  }
}

// ── Main request handler ─────────────────────────────────────────────────────

export async function handleMockRequest(endpoint: string, options: any): Promise<any> {
  await delay(300);

  const method = (options.method || "GET").toUpperCase();
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let body: any = null;
  if (options.body) {
    try {
      body = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
      if (typeof body === "string") body = JSON.parse(body);
    } catch { body = options.body; }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  if (normalized === "/auth/login") {
    const email = body?.email || "mock@example.com";
    const name = email.split("@")[0];
    const user: MockUser = {
      id: "mock-user-id",
      email,
      full_name: name.charAt(0).toUpperCase() + name.slice(1),
    };
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
    return { data: { access_token: "mock-access-token-jwt-style" } };
  }

  if (normalized === "/auth/register") {
    const email = body?.email || "mock@example.com";
    const user: MockUser = {
      id: "mock-user-id-" + Math.random().toString(36).substring(2, 9),
      email,
      full_name: body?.full_name || "New Mock User",
    };
    const users = getMockUsers();
    users.push(user);
    saveMockUsers(users);
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
    return { data: { success: true } };
  }

  if (normalized === "/auth/me") {
    const currentUser = localStorage.getItem(MOCK_CURRENT_USER_KEY);
    if (!currentUser) throw new Error("401: Unauthorized");
    return { data: JSON.parse(currentUser) };
  }

  if (normalized === "/auth/refresh") return { data: { access_token: "mock-access-token-jwt-style" } };

  if (normalized === "/auth/logout") {
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
    return { success: true };
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  if (normalized === "/projects") {
    if (method === "GET") return getMockProjects();
    if (method === "POST") {
      const newProj: MockProject = {
        id: "proj-" + Math.random().toString(36).substring(2, 9),
        owner_id: "mock-user-id",
        name: body?.name || "Untitled Project",
        description: body?.description || "",
        created_at: new Date().toISOString(),
        model_count: 0,
        member_count: 1,
        storage_bytes: 0,
        status: "Draft",
      };
      const projs = getMockProjects();
      projs.push(newProj);
      saveMockProjects(projs);
      return newProj;
    }
  }

  // ── Project member sub-routes: /projects/:id/members … ────────────────────
  // Must be checked BEFORE the generic /projects/:id handler below.

  const membersMatch = normalized.match(/^\/projects\/([^/]+)\/members(?:\/([^/]+))?$/);
  if (membersMatch) {
    const projId = membersMatch[1]!;
    const userId = membersMatch[2];

    ensureOwnerMember(projId);
    const members = getMockMembers(projId);

    if (method === "GET" && !userId) {
      return members;
    }

    if (method === "POST" && !userId) {
      const email: string = body?.email || "member@example.com";
      const role: MockMember["role"] = body?.role || "viewer";
      const existingUser = getMockUsers().find((u) => u.email === email);
      const newMember: MockMember = {
        id: "member-" + Math.random().toString(36).substring(2, 9),
        projectId: projId,
        userId: existingUser?.id || "user-" + Math.random().toString(36).substring(2, 9),
        email,
        fullName: existingUser?.full_name || (email || "member@example.com").split("@")[0]!.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        role,
        joinedAt: new Date().toISOString(),
        avatarColor: AVATAR_PALETTE[members.length % AVATAR_PALETTE.length] || "#7c3aed",
      };
      members.push(newMember);
      saveMockMembers(projId, members);

      // bump member_count on the project
      const projs = getMockProjects();
      const pIdx = projs.findIndex((p) => p.id === projId);
      if (pIdx !== -1 && projs[pIdx]) {
        projs[pIdx]!.member_count = members.length;
        saveMockProjects(projs);
      }
      return newMember;
    }

    if (method === "DELETE" && userId) {
      const filtered = members.filter((m) => m.userId !== userId);
      saveMockMembers(projId, filtered);

      const projs = getMockProjects();
      const pIdx = projs.findIndex((p) => p.id === projId);
      if (pIdx !== -1 && projs[pIdx]) {
        projs[pIdx]!.member_count = filtered.length;
        saveMockProjects(projs);
      }
      return { success: true };
    }
  }

  // ── Project models sub-route: /projects/:id/models ────────────────────────

  const projModelsMatch = normalized.match(/^\/projects\/([^/]+)\/models$/);
  if (projModelsMatch) {
    const projId = projModelsMatch[1]!;
    const models = getMockModelsForProject(projId);

    // Seed a demo model for "proj-1" so the table is populated on first load
    if (models.length === 0) {
      const projs = getMockProjects();
      const proj = projs.find((p) => p.id === projId);
      if (proj && proj.model_count > 0) {
        const seed: MockModel = {
          id: `model-${projId}-seed`,
          project_id: projId,
          filename: "Residential_Villa.ifc",
          content_type: "application/octet-stream",
          size_bytes: proj.storage_bytes || 12 * 1024 * 1024,
          status: "ready",
          created_at: proj.created_at,
        };
        localStorage.setItem(`mock_model_${seed.id}`, JSON.stringify(seed));
        return [seed];
      }
    }
    return models;
  }

  // ── Generic project CRUD: /projects/:id ───────────────────────────────────

  if (normalized.startsWith("/projects/")) {
    const projId = normalized.substring("/projects/".length);
    const projs = getMockProjects();
    const index = projs.findIndex((p) => p.id === projId);

    if (method === "GET") {
      if (index === -1) throw new Error("404: Project not found");
      return projs[index];
    }
    if (method === "PATCH") {
      if (index === -1) throw new Error("404: Project not found");
      const updated = { ...projs[index], ...body, updated_at: new Date().toISOString() };
      projs[index] = updated;
      saveMockProjects(projs);
      return updated;
    }
    if (method === "DELETE") {
      if (index === -1) throw new Error("404: Project not found");
      saveMockProjects(projs.filter((p) => p.id !== projId));
      return { success: true };
    }
  }

  // ── Models upload ─────────────────────────────────────────────────────────

  if (normalized === "/models/upload") {
    const modelId = "model-" + Math.random().toString(36).substring(2, 9);
    const model: MockModel = {
      id: modelId,
      project_id: body?.project_id || "proj-1",
      filename: body?.filename || "model.ifc",
      content_type: body?.content_type || "application/octet-stream",
      size_bytes: body?.size_bytes || 1024 * 1024,
      status: "ready",
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(`mock_model_${modelId}`, JSON.stringify(model));

    // Update project counters
    const projs = getMockProjects();
    const pIdx = projs.findIndex((p) => p.id === model.project_id);
    if (pIdx !== -1 && projs[pIdx]) {
      projs[pIdx]!.model_count += 1;
      projs[pIdx]!.storage_bytes += model.size_bytes;
      projs[pIdx]!.status = "Ready";
      saveMockProjects(projs);
    }

    return { upload_url: `local://${modelId}`, model_id: modelId };
  }

  if (normalized.endsWith("/confirm")) return { success: true };

  // ── Model sub-routes ──────────────────────────────────────────────────────

  if (normalized.startsWith("/models/")) {
    const parts = normalized.split("/");
    const modelId = parts[2]!;

    // Annotations
    if (normalized.endsWith("/annotations")) {
      const annoKey = `mock_annotations_${modelId}`;
      if (method === "GET") {
        try { return JSON.parse(localStorage.getItem(annoKey) || "[]"); }
        catch { return []; }
      }
      if (method === "POST") {
        const newAnno = {
          id: "anno-" + Math.random().toString(36).substring(2, 9),
          model_id: modelId,
          position_xyz: body?.position_xyz || [0, 0, 0],
          normal_xyz: body?.normal_xyz || [0, 0, 1],
          message: body?.message || "",
          status: "open",
          created_at: new Date().toISOString(),
        };
        let annos: any[] = [];
        try { annos = JSON.parse(localStorage.getItem(annoKey) || "[]"); } catch { /**/ }
        annos.push(newAnno);
        localStorage.setItem(annoKey, JSON.stringify(annos));
        return newAnno;
      }
    }

    // Delete model
    if (method === "DELETE") {
      const key = `mock_model_${modelId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const m: MockModel = JSON.parse(stored);
        localStorage.removeItem(key);
        localStorage.removeItem(`mock_annotations_${modelId}`);

        const projs = getMockProjects();
        const pIdx = projs.findIndex((p) => p.id === m.project_id);
        if (pIdx !== -1 && projs[pIdx]) {
          projs[pIdx]!.model_count = Math.max(0, projs[pIdx]!.model_count - 1);
          projs[pIdx]!.storage_bytes = Math.max(0, projs[pIdx]!.storage_bytes - m.size_bytes);
          if (projs[pIdx]!.model_count === 0) projs[pIdx]!.status = "Draft";
          saveMockProjects(projs);
        }
      }
      return { success: true };
    }

    // Get model by id
    const key = `mock_model_${modelId}`;
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return {
      id: modelId,
      project_id: "proj-1",
      filename: "sample_model.ifc",
      content_type: "application/octet-stream",
      size_bytes: 12 * 1024 * 1024,
      status: "ready",
      created_at: new Date().toISOString(),
    };
  }

  // ── Annotation patch ──────────────────────────────────────────────────────

  if (normalized.startsWith("/annotations/")) {
    const annoId = normalized.substring("/annotations/".length);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("mock_annotations_")) {
        try {
          const annos: any[] = JSON.parse(localStorage.getItem(key) || "[]");
          const idx = annos.findIndex((a) => a.id === annoId);
          if (idx !== -1) {
            if (method === "PATCH") {
              annos[idx] = { ...annos[idx], ...body };
              localStorage.setItem(key, JSON.stringify(annos));
              return annos[idx];
            } else if (method === "DELETE") {
              annos.splice(idx, 1);
              localStorage.setItem(key, JSON.stringify(annos));
              return { success: true };
            }
          }
        } catch { /**/ }
      }
    }
    throw new Error("404: Annotation not found");
  }

  throw new Error(`404: Mock endpoint not implemented: ${method} ${normalized}`);
}
