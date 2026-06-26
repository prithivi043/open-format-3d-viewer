import { useParams } from "react-router-dom";
import { ViewerProvider } from "../../features/viewer/context/ViewerProvider";
import { ViewerToolbar } from "../../features/viewer/components/ViewerToolbar";
import { ModelTree } from "../../features/viewer/components/ModelTree";
import { RightPanel } from "../../features/viewer/components/RightPanel";
import { ViewerStatusBar } from "../../features/viewer/components/ViewerStatusBar";
import { ViewerCanvas } from "../../features/viewer/components/ViewerCanvas";

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
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: "#080a1a" }}>
      <ViewerProvider modelId={modelId}>
        {/* Full-screen WebGL canvas */}
        <ViewerCanvas />

        {/* Top toolbar */}
        <ViewerToolbar />

        {/* Left panel: IFC spatial tree */}
        <ModelTree />

        {/* Right panel: Properties + Annotations tabs */}
        <RightPanel />

        {/* Bottom status bar */}
        <ViewerStatusBar />
      </ViewerProvider>
    </div>
  );
}
