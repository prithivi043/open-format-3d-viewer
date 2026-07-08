import { lazy, Suspense, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getModel } from "../../features/models/api/modelApi";
import { getProjectMembers } from "../../features/projects/api/projectApi";
import { useViewerStore } from "../../features/viewer/store/viewerStore";
import type { ViewerMember } from "../../features/viewer/types/viewer.types";

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

// ── Members loader: fetches model → project → members → puts in store ────────

function ViewerMembersSync({ modelId }: { modelId: string }) {
  const setProjectMembers = useViewerStore((s) => s.setProjectMembers);

  // 1) Fetch model metadata to get project_id
  const { data: model } = useQuery({
    queryKey: ["model", modelId],
    queryFn: () => getModel(modelId),
    staleTime: 1000 * 60 * 5,
  });

  // 2) Fetch project members once we have project_id
  const projectId = model?.project_id;
  const { data: members } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => getProjectMembers(projectId!),
    enabled: Boolean(projectId),
    staleTime: 1000 * 30,
  });

  // 3) Push members into viewerStore so ViewerStatusBar can read them
  useEffect(() => {
    if (!members) return;
    const slim: ViewerMember[] = members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      avatarColor: m.avatarColor,
    }));
    setProjectMembers(slim);
    return () => setProjectMembers([]); // clean up on unmount
  }, [members, setProjectMembers]);

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
        </ViewerProvider>
      </div>
    </Suspense>
  );
}
