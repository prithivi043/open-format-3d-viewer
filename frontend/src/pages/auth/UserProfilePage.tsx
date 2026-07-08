import { useState } from "react";
import { Settings } from "lucide-react";
import { useAuthStore } from "../../features/auth/store/authStore";
import ApiKeysTab from "../../features/settings/components/ApiKeysTab";
import WebhooksTab from "../../features/settings/components/WebhooksTab";
import AccountTab from "../../features/settings/components/AccountTab";
import type { PlanType } from "../../features/settings/types/settings.types";

type Tab = "Account" | "Security" | "API Keys" | "webhooks" | "preferences";
const TABS: Tab[] = [
  "Account",
  "Security",
  "API Keys",
  "webhooks",
  "preferences",
];

export default function UserProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>("API Keys");

  // Derive plan; backend may return it on the user object in future
  const plan: PlanType = (user && "plan" in user ? user.plan as PlanType : "Free") ?? "Free";

  return (
    <div className="min-h-screen bg-[#f8f8fc] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page heading */}
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 border-b border-[#d9cfc4]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-all relative ${
                activeTab === tab
                  ? "text-[#534AB7]"
                  : "text-[#777] hover:text-[#333]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#534AB7] rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === "Account" && <AccountTab />}
          {activeTab === "API Keys" && <ApiKeysTab plan={plan} />}
          {activeTab === "webhooks" && <WebhooksTab />}
          {(activeTab === "Security" || activeTab === "preferences") && (
            <div className="mt-16 text-center text-[#bbb]">
              <Settings size={36} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm">{activeTab} settings coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
