import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Mail, Shield, Loader2, CheckCircle2 } from "lucide-react";
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
  { value: "admin", label: "Admin", desc: "Full project control" },
];

const inviteSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  role: z.enum(["viewer", "editor", "admin"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function InviteMemberModal({
  projectId,
  isOpen,
  onClose,
}: Props) {
  const [success, setSuccess] = useState(false);
  const { mutateAsync, isPending, error } = useInviteMember(projectId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  const currentRole = watch("role");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({ email: "", role: "viewer" });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: InviteFormData) => {
    try {
      await mutateAsync({ email: data.email, role: data.role });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch {
      /* handled by mutation error object */
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Invite Member
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add a collaborator to this project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="colleague@company.com"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-blue-100 ${
                errors.email
                  ? "border-red-500 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Shield size={14} />
                Role
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setValue("role", r.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    currentRole === r.value
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold ${
                      currentRole === r.value
                        ? "text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    {r.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {r.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
              {error.message}
            </p>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
              <CheckCircle2 size={16} />
              Invitation sent!
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
