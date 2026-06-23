import { useParams } from "react-router-dom";

export default function ViewerPage() {
  const { modelId } = useParams();

  return (
    <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
      Viewer Page — Model: {modelId}
    </div>
  );
}
