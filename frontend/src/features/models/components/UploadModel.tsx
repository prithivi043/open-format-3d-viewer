import { useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileBox, X, FolderOpen } from "lucide-react";

import { useUploadModel } from "../hooks/useUploadModel";
import { useUploadStore } from "../store/uploadStore";
import UploadProgress from "./UploadProgress";

type Props = {
  projectId: string;
  onClose: () => void;
};

const ALLOWED_EXTENSIONS = ["ifc", "glb", "gltf", "fbx", "obj", "step", "stl"];
const MAX_FILE_SIZE = 500 * 1024 * 1024;

export default function UploadModel({ projectId, onClose }: Props) {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const uploadMutation = useUploadModel(projectId);
  const { progress, isUploading } = useUploadStore();

  const validateFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Unsupported file format");
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File exceeds 500MB limit");
      return false;
    }

    setError("");
    return true;
  };

  const handleFile = (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;
    setFile(selectedFile);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const modelId = await uploadMutation.mutateAsync(file);

      if (!modelId) {
        setError("Upload succeeded but model ID missing");
        return;
      }

      navigate(`/viewer/${modelId}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const extension = file?.name.split(".").pop()?.toUpperCase();

  return (
    <div className="w-full min-h-screen bg-[#f8f8fc] p-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Upload 3D Model
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload IFC, GLB, GLTF, FBX, OBJ, STEP, STL
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-12 min-h-[520px]">
          {/* Left */}
          <div className="col-span-8 p-8 border-r border-slate-200">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`h-full min-h-[430px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                dragActive
                  ? "border-[#534AB7] bg-[#f4f2ff]"
                  : "border-slate-300 bg-slate-50"
              }`}
            >
              <div className="w-20 h-20 rounded-3xl bg-[#ede9fe] flex items-center justify-center mb-6">
                <UploadCloud size={36} className="text-[#534AB7]" />
              </div>

              <h3 className="text-xl font-semibold text-slate-900">
                Drag & Drop Model Here
              </h3>

              <p className="mt-2 text-sm text-slate-500 text-center max-w-md">
                Drop your 3D model file here or browse from local storage.
              </p>

              <label className="mt-6 cursor-pointer rounded-xl bg-[#534AB7] px-5 py-3 text-white text-sm hover:bg-[#4338ca] transition">
                <div className="flex items-center gap-2">
                  <FolderOpen size={16} />
                  Browse Files
                </div>

                <input
                  type="file"
                  className="hidden"
                  accept=".ifc,.glb,.gltf,.fbx,.obj,.step,.stl"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) handleFile(selected);
                  }}
                />
              </label>

              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
          </div>

          {/* Right */}
          <div className="col-span-4 p-8 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900 mb-5">
              Model Info
            </h3>

            {!file ? (
              <p className="text-sm text-slate-500">
                Select a file to preview metadata.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl bg-white p-4 border">
                  <div className="flex items-center gap-3">
                    <FileBox size={24} className="text-[#534AB7]" />

                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 border space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Format</span>
                    <span className="font-medium">{extension}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="text-amber-600 font-medium">
                      {isUploading ? "Uploading..." : "Ready"}
                    </span>
                  </div>
                </div>

                {isUploading && <UploadProgress progress={progress} />}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="rounded-xl border px-5 py-2.5 text-sm"
          >
            Cancel
          </button>

          <button
            disabled={!file || isUploading}
            onClick={handleUpload}
            className="rounded-xl bg-[#534AB7] px-6 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload Model"}
          </button>
        </div>
      </div>
    </div>
  );
}
