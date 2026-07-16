import { lazy, Suspense, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getModel } from "../../features/models/api/modelApi";
import { getProjectMembers, getProject } from "../../features/projects/api/projectApi";
import { useViewerStore } from "../../features/viewer/store/viewerStore";
import type { ViewerMember } from "../../features/viewer/types/viewer.types";
import { useAuthStore } from "../../features/auth/store/authStore";


// ── Lazy-loaded viewer sub-components ────────────────────────────────────────

const ViewerProvider = lazy(() =>
  import("../../features/viewer/context/ViewerProvider").then((m) => ({
    default: m.ViewerProvider,
  })),
);

const ViewerToolbar = lazy(() =>
  import("../../features/viewer/components/ViewerToolbar").then((m) => ({
    default: m.ViewerToolbar,
  })),
);

const ModelTree = lazy(() =>
  import("../../features/viewer/components/ModelTree").then((m) => ({
    default: m.ModelTree,
  })),
);

const RightPanel = lazy(() =>
  import("../../features/viewer/components/RightPanel").then((m) => ({
    default: m.RightPanel,
  })),
);

const ViewerStatusBar = lazy(() =>
  import("../../features/viewer/components/ViewerStatusBar").then((m) => ({
    default: m.ViewerStatusBar,
  })),
);

const ViewerCanvas = lazy(() =>
  import("../../features/viewer/components/ViewerCanvas").then((m) => ({
    default: m.ViewerCanvas,
  })),
);

const ActiveMembersPanel = lazy(() =>
  import("../../features/viewer/components/ActiveMembersPanel").then((m) => ({
    default: m.ActiveMembersPanel,
  })),
);

/**
 * Scans localStorage for `local_models_{projectId}` keys to find which
 * backend project owns a given local- model file. Returns the projectId
 * string or null if not found.
 */
function findProjectIdForLocalModel(modelId: string): string | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("local_models_")) {
        const models = JSON.parse(localStorage.getItem(key) ?? "[]") as { id: string }[];
        if (models.some((m) => m.id === modelId)) {
          return key.replace("local_models_", "");
        }
      }
    }
  } catch {
    /* ignore parse errors */
  }
  return null;
}

// ── Members loader: fetches model → project → members → puts in store ────────

function ViewerMembersSync({ modelId }: { modelId: string }) {
  const setProjectMembers = useViewerStore((s) => s.setProjectMembers);
  const setUserRole = useViewerStore((s) => s.setUserRole);
  const currentUser = useAuthStore((s) => s.user);

  // A model whose ID is a UUID came from the backend; local- prefixed IDs are
  // files stored in IndexedDB. HOWEVER the project may still be a backend project,
  // so we must still fetch members even for local models.
  const isBackendModel = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelId);

  // For local models, recover the projectId from localStorage so we can still
  // fetch the real project members that were created on the backend.
  const localProjectId = !isBackendModel ? findProjectIdForLocalModel(modelId) : null;

  // 1) Fetch model metadata to get project_id (only for backend models)
  const { data: model } = useQuery({
    queryKey: ["model", modelId],
    queryFn: () => getModel(modelId),
    enabled: isBackendModel,
    staleTime: 1000 * 60 * 5,
  });

  // Effective project ID — either from the model API response or from localStorage
  const projectId = isBackendModel ? model?.project_id : localProjectId;

  // 2) Fetch project members once we have project_id (works for local AND backend models)
  const { data: members } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => getProjectMembers(projectId!),
    enabled: Boolean(projectId),
    staleTime: 1000 * 30,
  });

  // 3) Fetch project details to check owner_id (works for local AND backend models)
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId!),
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 5,
  });

  // 4) Push members into viewerStore so ViewerStatusBar / ActiveMembersPanel can read them
  useEffect(() => {
    // If we cannot determine the project at all (e.g. truly isolated local file
    // with no backend project), fall back to Admin so the user can still use all tools.
    if (!projectId) {
      setUserRole("admin");
      return;
    }

    if (!members) return;

    const slim: ViewerMember[] = members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      avatarColor: m.avatarColor,
      role: m.role,
    }));
    setProjectMembers(slim);

    // Determine current user's role on this project
    const currentMember = members.find((m) => m.userId === currentUser?.id);
    if (currentMember) {
      setUserRole(currentMember.role);
    } else if (project && currentUser && project.ownerId === currentUser.id) {
      setUserRole("admin");
    } else {
      // Fallback: if the user opened the project (they have the modelId) but
      // aren't in the members list, treat them as admin for local convenience.
      setUserRole(!isBackendModel ? "admin" : "viewer");
    }

    return () => {
      setProjectMembers([]);
      setUserRole(null);
    };
  }, [members, project, currentUser, projectId, isBackendModel, setProjectMembers, setUserRole]);


  // Renders nothing — purely a data-sync side effect
  return null;
}

// ── Loading fallback ──────────────────────────────────────────────────────────

function ViewerLoading() {
  return (
    <div className="w-screen h-screen bg-[#080a1a] flex items-center justify-center text-white">
      Loading 3D Viewer…
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ViewerPage() {
  const { modelId } = useParams<{ modelId: string }>();

  if (!modelId) {
    return (
      <div className="w-screen h-screen bg-[#080a1a] flex items-center justify-center text-gray-400 text-sm">
        No model ID provided
      </div>
    );
  }

  return (
    <Suspense fallback={<ViewerLoading />}>
      {/* Data sync — runs outside the 3D canvas, no rendering cost */}
      <ViewerMembersSync modelId={modelId} />

      <div
        className="w-screen h-screen overflow-hidden relative"
        style={{ background: "#080a1a" }}
      >
        <ViewerProvider modelId={modelId}>
          <ViewerCanvas />
          <ViewerToolbar />
          <ModelTree />
          <RightPanel />
          <ViewerStatusBar />
          <ActiveMembersPanel />
        </ViewerProvider>
      </div>
    </Suspense>
  );
}
