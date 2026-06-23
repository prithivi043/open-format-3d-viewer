import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, Users } from "lucide-react";

import { useProject } from "../../features/projects/hooks/useProject";
import { useLayoutStore } from "../../stores/layoutStore";

type Tab = "models" | "members" | "activity" | "settings";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveNav } = useLayoutStore();

  const { data: project, isLoading, isError } = useProject(id ?? "");

  const [activeTab, setActiveTab] = useState<Tab>("models");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        Loading project...
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center text-red-500">
        Project not found
      </div>
    );
  }

  const openUpload = () => {
    setActiveNav("models");
    navigate(`/models/upload?projectId=${project.id}`);
  };

  const tabClass = (tab: Tab) =>
    `px-4 py-3 text-sm font-medium border-b-2 transition ${
      activeTab === tab
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-slate-500 hover:text-black"
    }`;

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="text-sm text-slate-500">
          Projects <span className="mx-2">{">"}</span>
          <span className="text-slate-700">{project.name}</span>
        </div>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {project.name}
            </h1>

            <p className="mt-2 text-slate-500">
              {project.description || "No description"}
            </p>
          </div>

          <div className="flex gap-3">
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Users size={16} />
                Invite Members
              </div>
            </button>

            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              onClick={openUpload}
            >
              <div className="flex items-center gap-2">
                <Upload size={16} />
                Upload Model
              </div>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-slate-200 bg-white rounded-t-xl px-4">
          <div className="flex gap-2">
            <button
              className={tabClass("models")}
              onClick={() => setActiveTab("models")}
            >
              Models
            </button>

            <button
              className={tabClass("members")}
              onClick={() => setActiveTab("members")}
            >
              Members
            </button>

            <button
              className={tabClass("activity")}
              onClick={() => setActiveTab("activity")}
            >
              Activity
            </button>

            <button
              className={tabClass("settings")}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-b-xl bg-white p-6 shadow-sm min-h-[500px]">
          {activeTab === "models" && (
            <div className="flex h-[350px] flex-col items-center justify-center text-center">
              <Upload size={42} className="mb-4 text-slate-400" />

              <h3 className="text-lg font-semibold text-slate-800">
                No models uploaded
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Upload IFC / GLB / GLTF models to start viewing.
              </p>

              <button
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white"
                onClick={openUpload}
              >
                Upload Model
              </button>
            </div>
          )}

          {activeTab === "members" && (
            <p className="text-slate-500">Members module coming soon.</p>
          )}

          {activeTab === "activity" && (
            <p className="text-slate-500">Activity module coming soon.</p>
          )}

          {activeTab === "settings" && (
            <p className="text-slate-500">Settings module coming soon.</p>
          )}
        </div>
      </div>
    </div>
  );
}
