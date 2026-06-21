import { useState } from "react";
import { useParams } from "react-router-dom";
import { Upload, Users } from "lucide-react";

import { useProject } from "../../features/projects/hooks/useProject";

type Tab = "models" | "members" | "activity" | "settings";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { data: project, isLoading, isError } = useProject(id ?? "");

  const [activeTab, setActiveTab] = useState<Tab>("models");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        Loading...
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

  const mockModels = [
    {
      name: "Tower_Design.ifc",
      format: "IFC",
      status: "Ready",
      size: "12.4 GB",
      updated: "2 hours ago",
    },
    {
      name: "Road_Model.glb",
      format: "GLB",
      status: "Processing",
      size: "8.1 GB",
      updated: "1 hour ago",
    },
    {
      name: "Bridge_Model.stl",
      format: "STL",
      status: "Failed",
      size: "2.8 GB",
      updated: "Yesterday",
    },
  ];

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

            <p className="mt-2 text-slate-500">{project.description}</p>
          </div>

          <div className="flex gap-3">
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Users size={16} />
                Invite Members
              </div>
            </button>

            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
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
        <div className="rounded-b-xl bg-white p-6 shadow-sm">
          {activeTab === "models" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="pb-4">Model Name</th>
                    <th className="pb-4">Format</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Size</th>
                    <th className="pb-4">Updated</th>
                    <th className="pb-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {mockModels.map((model) => (
                    <tr key={model.name} className="border-b">
                      <td className="py-4 font-medium text-slate-800">
                        {model.name}
                      </td>

                      <td>{model.format}</td>

                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            model.status === "Ready"
                              ? "bg-green-100 text-green-600"
                              : model.status === "Processing"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-red-100 text-red-600"
                          }`}
                        >
                          {model.status}
                        </span>
                      </td>

                      <td>{model.size}</td>
                      <td>{model.updated}</td>

                      <td>
                        <button className="rounded-md border px-3 py-1 text-blue-600">
                          Open Viewer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
