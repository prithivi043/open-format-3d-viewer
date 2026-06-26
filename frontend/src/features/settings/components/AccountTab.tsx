import { Crown, Mail, Zap, Building2 } from "lucide-react";
import { useAuthStore } from "../../auth/store/authStore";
import type { PlanType } from "../types/settings.types";

export default function AccountTab() {
  const user = useAuthStore((s) => s.user);
  const plan = useAuthStore((s) => s.plan);
  const setPlan = useAuthStore((s) => s.setPlan);

  const initials = user?.full_name?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-[#ede8e0] p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#534AB7] flex items-center justify-center text-white text-xl font-bold shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">
            {user?.full_name ?? "—"}
          </h2>
          <p className="text-sm text-[#888]">{user?.email}</p>
          <span className="inline-block mt-1.5 text-xs bg-[#f0ebe3] text-[#555] px-2.5 py-0.5 rounded-full capitalize">
            {plan} Plan
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#ede8e0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={14} className="text-[#888]" />
            <p className="text-xs text-[#888] font-medium">Email</p>
          </div>
          <p className="text-sm font-medium text-[#1a1a1a]">
            {user?.email ?? "—"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#ede8e0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={14} className="text-[#888]" />
            <p className="text-xs text-[#888] font-medium">Current Plan</p>
          </div>
          <p className="text-sm font-medium text-[#1a1a1a]">{plan}</p>
        </div>
      </div>

      {/* Subscription selector */}
      <div className="bg-white rounded-2xl border border-[#ede8e0] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Crown size={16} className="text-[#7c3aed]" />
          <h3 className="font-semibold text-[#1a1a1a]">Subscription Plans</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(["Free", "Pro", "Enterprise"] as PlanType[]).map((p) => (
            <div
              key={p}
              onClick={() => setPlan(p)}
              className={`rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
                plan === p
                  ? "border-[#7c3aed] bg-[#f5f0ff]"
                  : "border-[#ede8e0]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {p === "Free" && <Zap size={14} className="text-[#888]" />}
                  {p === "Pro" && (
                    <Crown size={14} className="text-[#7c3aed]" />
                  )}
                  {p === "Enterprise" && (
                    <Building2 size={14} className="text-amber-500" />
                  )}
                  <h4 className="font-semibold text-sm text-[#1a1a1a]">{p}</h4>
                </div>

                {plan === p && (
                  <span className="text-[10px] bg-[#7c3aed] text-white px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>

              <p className="text-xs text-[#888]">
                {p === "Free" && "Basic access · 50 MB files"}
                {p === "Pro" && "Advanced viewer + collaboration · 500 MB"}
                {p === "Enterprise" && "Full enterprise features · 5 GB files"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
