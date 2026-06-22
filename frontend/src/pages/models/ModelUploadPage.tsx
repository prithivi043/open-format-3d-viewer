import { useSearchParams, useNavigate } from "react-router-dom";
import UploadModel from "../../features/models/components/UploadModel";
import { useLayoutStore } from "../../stores/layoutStore";
import { useEffect } from "react";

export default function ModelUploadPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setActiveNav } = useLayoutStore();

  const projectId = params.get("projectId");

  useEffect(() => {
    setActiveNav("models");
  }, [setActiveNav]);

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb]">
        No project selected
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f5f7fb]">
      <UploadModel projectId={projectId} onClose={() => navigate(-1)} />
    </div>
  );
}
