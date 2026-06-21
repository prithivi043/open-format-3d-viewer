import { useState } from "react";
import { useUploadModel } from "../hooks/useUploadModel";
import { useUploadStore } from "../store/uploadStore";
import UploadProgress from "./UploadProgress";

type Props = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function UploadModelModal({
  projectId,
  isOpen,
  onClose,
}: Props) {
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useUploadModel(projectId);
  const { progress, isUploading } = useUploadStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[500px] rounded-xl bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Upload 3D Model</h2>

        <input
          type="file"
          accept=".ifc,.glb,.gltf,.fbx,.obj,.step,.stl"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) setFile(selected);
          }}
        />

        {isUploading && <UploadProgress progress={progress} />}

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose}>Cancel</button>

          <button
            disabled={!file || isUploading}
            className="rounded bg-blue-600 px-4 py-2 text-white"
            onClick={() => {
              if (file) uploadMutation.mutate(file);
            }}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
