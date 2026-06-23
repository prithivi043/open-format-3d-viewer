import { useState } from "react";
import { Crown, User, Mail, BadgeCheck } from "lucide-react";
import { useAuthStore } from "../../features/auth/store/authStore";

type PlanType = "Free" | "Pro" | "Enterprise";

export default function UserProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [plan, setPlan] = useState<PlanType>("Free");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading user...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-900">User Profile</h1>
        <p className="mt-2 text-slate-500">
          Manage account and subscription plan
        </p>

        {/* Profile Card */}
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
              {user.full_name?.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <h2 className="text-2xl font-semibold">{user.full_name}</h2>
              <p className="text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <User size={18} />
              <p className="mt-2 text-sm text-slate-500">User ID</p>
              <p className="text-sm font-medium break-all">{user.id}</p>
            </div>

            <div className="rounded-xl border p-4">
              <Mail size={18} />
              <p className="mt-2 text-sm text-slate-500">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>

            <div className="rounded-xl border p-4">
              <BadgeCheck size={18} />
              <p className="mt-2 text-sm text-slate-500">Current Plan</p>
              <p className="text-sm font-medium">{plan}</p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2">
            <Crown size={20} />
            <h2 className="text-xl font-semibold">Subscription Plans</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Free", "Pro", "Enterprise"].map((item) => (
              <button
                key={item}
                onClick={() => setPlan(item as PlanType)}
                className={`rounded-2xl border p-6 text-left transition ${
                  plan === item
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200"
                }`}
              >
                <h3 className="font-semibold">{item}</h3>

                <p className="mt-2 text-sm text-slate-500">
                  {item === "Free" && "Basic access"}
                  {item === "Pro" && "Advanced viewer + collaboration"}
                  {item === "Enterprise" && "Full enterprise features"}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
