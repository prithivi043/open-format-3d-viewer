import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "../schemas/authSchema";
import { useSignup } from "../hooks/useSignup";
import {
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  User,
  Mail,
  Lock,
  ShieldCheck,
} from "lucide-react";
import GoogleIcon from "../components/GoogleIcon";

export default function SignUpForm() {
  const mutation = useSignup();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch("password") || "";
  const passwordStrength =
    password.length >= 12
      ? 3
      : password.length >= 8
        ? 2
        : password.length > 0
          ? 1
          : 0;

  const onSubmit = (data: SignupFormData) => mutation.mutate(data);

  const inputClass = `
    w-full rounded-2xl
    border border-white/10
    bg-white/[0.03]
    backdrop-blur-xl
    py-3 pl-12 pr-4
    text-[15px] text-white
    placeholder:text-slate-500
    shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]
    transition-all duration-300
    hover:border-white/20
    focus:border-cyan-400
    focus:ring-4 focus:ring-cyan-500/10
    outline-none
  `;

  return (
    <>
      {/* Header */}
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
            Enterprise 3D Platform
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Create your workspace
        </h1>
      </div>

      {/* Google Auth */}
      <button
        type="button"
        onClick={() => {
          window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
        }}
        className="
        group w-full rounded-xl
        border border-white/10
        bg-white/[0.03]
        py-2.5 text-sm
        hover:bg-white/[0.06]
        hover:border-white/20
        transition-all duration-300
        flex items-center justify-center gap-3
      "
      >
        <GoogleIcon />
        Continue with Google
      </button>

      {/* Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <span className="text-[10px] tracking-[0.22em] text-slate-500 uppercase">
          Or continue with email
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      {/* Error */}
      {mutation.isError && (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {(mutation.error as Error)?.message ?? "Sign up failed. Try again."}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-300">
            Full Name
          </label>

          <div className="relative">
            <User
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              {...register("full_name")}
              placeholder="Your name"
              className={`${inputClass} ${errors.full_name ? "border-red-500" : ""}`}
            />
          </div>

          {errors.full_name && (
            <p className="mt-1 text-[11px] text-red-400">
              {errors.full_name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-300">
            Email Address
          </label>

          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              {...register("email")}
              placeholder="you@example.com"
              className={`${inputClass} ${errors.email ? "border-red-500" : ""}`}
            />
          </div>

          {errors.email && (
            <p className="mt-1 text-[11px] text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-300">
            Password
          </label>

          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="Minimum 8 characters"
              className={`${inputClass} pr-11 ${
                errors.password ? "border-red-500" : ""
              }`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password Strength */}
          <div className="mt-1.5 flex gap-1">
            <div
              className={`h-[3px] flex-1 rounded ${
                passwordStrength >= 1 ? "bg-cyan-400" : "bg-white/10"
              }`}
            />
            <div
              className={`h-[3px] flex-1 rounded ${
                passwordStrength >= 2 ? "bg-cyan-400" : "bg-white/10"
              }`}
            />
            <div
              className={`h-[3px] flex-1 rounded ${
                passwordStrength >= 3 ? "bg-cyan-400" : "bg-white/10"
              }`}
            />
          </div>

          {errors.password && (
            <p className="mt-1 text-[11px] text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="
          group relative overflow-hidden
          w-full rounded-xl py-2.5
          bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600
          text-sm font-semibold text-white
          shadow-[0_8px_25px_rgba(6,182,212,0.35)]
          transition-all duration-500
          hover:scale-[1.01]
          active:scale-[0.99]
          disabled:opacity-50
          flex items-center justify-center gap-2
        "
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000" />

          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Create Workspace
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Sign in
        </Link>
      </p>

      {/* Trust Footer */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck size={12} />
        Secure authentication with OAuth 2.0 & JWT
      </div>
    </>
  );
}
