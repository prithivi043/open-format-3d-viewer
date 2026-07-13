import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const securitySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SecurityFormData = z.infer<typeof securitySchema>;

export default function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordVal = watch("newPassword") || "";

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { score, label: "Medium", color: "bg-amber-500" };
    if (score === 3) return { score, label: "Strong", color: "bg-blue-500" };
    return { score, label: "Very Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(newPasswordVal);

  const onSubmit = async (data: SecurityFormData) => {
    setIsPending(true);
    setError("");
    setSuccess(false);

    try {
      // Simulate API response since backend has no update password endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Save simulated password state to localStorage (pure frontend logic)
      localStorage.setItem("user_simulated_password", data.newPassword);
      setSuccess(true);
      reset();
    } catch (err) {
      setError("Failed to update password. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={18} className="text-[#534AB7]" />
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Security Settings</h2>
          <p className="text-sm text-[#888]">Change your account password and manage security preferences</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <p className="text-sm font-medium">Password updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              {...register("currentPassword")}
              className={`w-full border rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none transition-colors ${
                errors.currentPassword
                  ? "border-red-400 focus:border-red-400"
                  : "border-[#ede8e0] focus:border-[#534AB7]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              {...register("newPassword")}
              className={`w-full border rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none transition-colors ${
                errors.newPassword
                  ? "border-red-400 focus:border-red-400"
                  : "border-[#ede8e0] focus:border-[#534AB7]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.newPassword.message}
            </p>
          )}

          {/* Password strength bar */}
          {newPasswordVal && (
            <div className="mt-2.5 space-y-1.5">
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>Strength: <span className="font-bold">{strength.label}</span></span>
                <span>{strength.score}/4</span>
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 transition-all duration-300 ${
                      i <= strength.score ? strength.color : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              {...register("confirmPassword")}
              className={`w-full border rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none transition-colors ${
                errors.confirmPassword
                  ? "border-red-400 focus:border-red-400"
                  : "border-[#ede8e0] focus:border-[#534AB7]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#534AB7] text-white text-sm py-2.5 rounded-xl font-medium hover:bg-[#4338ca] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Update Password
        </button>
      </form>
    </div>
  );
}
