import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Mail, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useInviteMember } from "../hooks/useInviteMember";
import type { ProjectRole } from "../types/project.types";

interface Props {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ROLES: { value: ProjectRole; label: string; desc: string }[] = [
  { value: "viewer", label: "Viewer", desc: "Can view and comment on models" },
  { value: "editor", label: "Editor", desc: "Can upload and edit models" },
  { value: "admin",  label: "Admin",  desc: "Full project control" },
];

const inviteSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  role: z.enum(["viewer", "editor", "admin"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function InviteMemberModal({ projectId, isOpen, onClose }: Props) {
  const [apiError, setApiError]   = useState("");
  const [success,  setSuccess]    = useState(false);

  const { mutateAsync, isPending, reset: resetMutation } = useInviteMember(projectId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset: resetForm,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "viewer" },
  });

  const currentRole = watch("role");

  // Full reset every time the modal opens or closes
  useEffect(() => {
    if (isOpen) {
      resetForm({ email: "", role: "viewer" });
      setApiError("");
      setSuccess(false);
      resetMutation();
    }
  }, [isOpen, resetForm, resetMutation]);

  const handleClose = () => {
    resetMutation();
    setApiError("");
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (data: InviteFormData) => {
    setApiError("");
    setSuccess(false);
    try {
      await mutateAsync({ email: data.email, role: data.role });
      setSuccess(true);
      // After 2 s auto-close so the member list refreshes immediately
      setTimeout(() => {
        setSuccess(false);
        handleClose();
      }, 2000);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";

      // Translate backend error messages into friendly UI copy
      let msg = raw;
      if (
        /not found/i.test(raw) ||
        /no account/i.test(raw) ||
        raw.includes("404")
      ) {
        msg =
          "No account found for that email address. The person needs to sign up first.";
      } else if (/already a member/i.test(raw) || /conflict/i.test(raw)) {
        msg = "This person is already a member of the project.";
      } else if (/forbidden|permission/i.test(raw)) {
        msg = "You need Admin role to invite members.";
      } else if (!raw) {
        msg = "Failed to send invitation. Please try again.";
      }

      setApiError(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Invite Member</h2>
              <p className="text-xs text-slate-500 mt-0.5">Add a collaborator to this project</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Success state ─────────────────────────────────────── */}
        {success ? (
          <div className="px-6 py-10 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-900">Invitation sent!</p>
              <p className="text-sm text-slate-500 mt-1">
                The member will receive an email shortly.
              </p>
            </div>
          </div>
        ) : (
          /* ── Form ────────────────────────────────────────────── */
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-6 py-5 space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                autoComplete="off"
                {...register("email")}
                placeholder="colleague@company.com"
                disabled={isPending}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition
                  focus:ring-2 focus:ring-blue-100 disabled:opacity-60
                  ${errors.email
                    ? "border-red-400 focus:border-red-400"
                    : "border-slate-200 focus:border-blue-500"
                  }`}
              />
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500 font-medium">
                  <AlertCircle size={11} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <Shield size={14} /> Role
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    disabled={isPending}
                    onClick={() => setValue("role", r.value, { shouldValidate: true })}
                    className={`rounded-xl border p-3 text-left transition disabled:opacity-60
                      ${currentRole === r.value
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300"
                        : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <p className={`text-xs font-semibold ${currentRole === r.value ? "text-blue-700" : "text-slate-700"}`}>
                      {r.label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* API error */}
            {apiError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600 leading-snug">{apiError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition"
              >
                Cancel
              </button>
              <button
                id="invite-submit-btn"
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {isPending ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
