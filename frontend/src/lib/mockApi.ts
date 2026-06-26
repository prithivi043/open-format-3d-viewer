// src/lib/mockApi.ts

const MOCK_CURRENT_USER_KEY = "mock_current_user";
const MOCK_USERS_KEY = "mock_users";
const MOCK_PROJECTS_KEY = "mock_projects";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function isMockModeActive(): boolean {
  return localStorage.getItem("use_mock_api") === "true";
}

export function setMockMode(active: boolean) {
  if (active) {
    localStorage.setItem("use_mock_api", "true");
  } else {
    localStorage.removeItem("use_mock_api");
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
  }
}

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

function getMockUsers(): MockUser[] {
  try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveMockUsers(users: MockUser[]) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function getMockProjects(): MockProject[] {
  try {
    const stored = localStorage.getItem(MOCK_PROJECTS_KEY);
    if (!stored) {
      const defaultProjects: MockProject[] = [
        {
          id: "proj-1",
          owner_id: "mock-user-id",
          name: "Residential Villa Project",
          description: "A 3D BIM model of a two-story residential villa, including structural and architectural elements.",
          created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
          model_count: 1,
          member_count: 3,
          storage_bytes: 45 * 1024 * 1024,
          status: "Ready",
        },
        {
          id: "proj-2",
          owner_id: "mock-user-id",
          name: "Office Tower Concept",
          description: "Schematic design for a high-rise office building in the downtown area.",
          created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
          model_count: 0,
          member_count: 1,
          storage_bytes: 0,
          status: "Draft",
        },
      ];
      localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(defaultProjects));
      return defaultProjects;
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveMockProjects(projects: MockProject[]) {
  localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));
}

export async function handleMockRequest(endpoint: string, options: any): Promise<any> {
  await delay(300); // simulate network latency

  const method = (options.method || "GET").toUpperCase();
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Parse body if it's a string, otherwise use as-is
  let body: any = null;
  if (options.body) {
    if (typeof options.body === "string") {
      try {
        body = JSON.parse(options.body);
        // Handle double-stringification if the body itself was stringified before passing
        if (typeof body === "string") {
          body = JSON.parse(body);
        }
      } catch {
        body = options.body;
      }
    } else {
      body = options.body;
    }
  }

  // --- Auth endpoints ---
  if (normalized === "/auth/login") {
    const email = body?.email || "mock@example.com";
    const name = email.split("@")[0];
    const user: MockUser = {
      id: "mock-user-id",
      email,
      full_name: name.charAt(0).toUpperCase() + name.slice(1),
    };
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true };
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
    return { success: true };
  }

  if (normalized === "/auth/me") {
    const currentUser = localStorage.getItem(MOCK_CURRENT_USER_KEY);
    if (!currentUser) {
      throw new Error("401: Unauthorized");
    }
    return { data: JSON.parse(currentUser) };
  }

  if (normalized === "/auth/refresh") {
    return { success: true };
  }

  if (normalized === "/auth/logout") {
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
    return { success: true };
  }

  // --- Projects endpoints ---
  if (normalized === "/projects") {
    if (method === "GET") {
      return getMockProjects();
    }
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
      const updated = {
        ...projs[index],
        ...body,
        updated_at: new Date().toISOString(),
      };
      projs[index] = updated;
      saveMockProjects(projs);
      return updated;
    }
    if (method === "DELETE") {
      if (index === -1) throw new Error("404: Project not found");
      const filtered = projs.filter((p) => p.id !== projId);
      saveMockProjects(filtered);
      return { success: true };
    }
  }

  // --- Models endpoints ---
  if (normalized === "/models/upload") {
    const modelId = "model-" + Math.random().toString(36).substring(2, 9);
    // Automatically create a mock model under this project in mock store
    const model = {
      id: modelId,
      project_id: body?.project_id || "proj-1",
      filename: body?.filename || "model.xkt",
      content_type: body?.content_type || "application/octet-stream",
      size_bytes: body?.size_bytes || 1024 * 1024,
      status: "ready",
      created_at: new Date().toISOString(),
    };
    const key = `mock_model_${modelId}`;
    localStorage.setItem(key, JSON.stringify(model));

    // Update project model count & storage size
    const projs = getMockProjects();
    const pIdx = projs.findIndex((p) => p.id === (body?.project_id || "proj-1"));
    if (pIdx !== -1) {
      const p = projs[pIdx];
      if (p) {
        p.model_count += 1;
        p.storage_bytes += model.size_bytes;
        p.status = "Ready";
        saveMockProjects(projs);
      }
    }

    return {
      upload_url: "local://" + modelId,
      model_id: modelId,
    };
  }

  if (normalized.endsWith("/confirm")) {
    return { success: true };
  }

  if (normalized.startsWith("/models/")) {
    const modelId = normalized.split("/")[2];
    
    // Check if it is the annotations sub-endpoint: /models/:id/annotations
    if (normalized.endsWith("/annotations")) {
      const key = `mock_annotations_${modelId}`;
      if (method === "GET") {
        try {
          return JSON.parse(localStorage.getItem(key) || "[]");
        } catch {
          return [];
        }
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
        let annos = [];
        try {
          annos = JSON.parse(localStorage.getItem(key) || "[]");
        } catch {}
        annos.push(newAnno);
        localStorage.setItem(key, JSON.stringify(annos));
        return newAnno;
      }
    }

    const key = `mock_model_${modelId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      id: modelId,
      project_id: "proj-1",
      filename: "sample_model.xkt",
      content_type: "application/octet-stream",
      size_bytes: 12 * 1024 * 1024,
      status: "ready",
      created_at: new Date().toISOString(),
    };
  }

  if (normalized.startsWith("/annotations/")) {
    const annoId = normalized.substring("/annotations/".length);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mock_annotations_")) {
        try {
          const annos = JSON.parse(localStorage.getItem(key) || "[]");
          const idx = annos.findIndex((a: any) => a.id === annoId);
          if (idx !== -1) {
            if (method === "PATCH") {
              const updated = { ...annos[idx], ...body };
              annos[idx] = updated;
              localStorage.setItem(key, JSON.stringify(annos));
              return updated;
            }
          }
        } catch {}
      }
    }
    throw new Error("404: Annotation not found");
  }

  throw new Error(`404: Mock endpoint not implemented: ${method} ${normalized}`);
}
