import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema, type SigninFormData } from "../schemas/authSchema";
import { useSignin } from "../hooks/useSignin";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, Lock } from "lucide-react";

export default function SignInForm() {
  const mutation = useSignin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = (data: SigninFormData) => mutation.mutate(data);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <p className="text-cyan-400 text-xs uppercase tracking-[0.3em] mb-3">
          3D Viewer Platform
        </p>

        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>

        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Sign in to access your 3D workspace and continue exploring models.
        </p>
      </div>

      {/* Error */}
      {mutation.isError && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {(mutation.error as Error)?.message ?? "Sign in failed. Try again."}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-slate-400">
            Email
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              className={`
                w-full rounded-xl border bg-white/5 backdrop-blur-md
                py-3 pl-12 pr-4 text-white placeholder-slate-500
                outline-none transition-all duration-300
                focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10
                ${
                  errors.email
                    ? "border-red-500"
                    : "border-white/10 hover:border-white/20"
                }
              `}
            />
          </div>

          {errors.email && (
            <p className="mt-2 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-slate-400">
            Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className={`
                w-full rounded-xl border bg-white/5 backdrop-blur-md
                py-3 pl-12 pr-12 text-white placeholder-slate-500
                outline-none transition-all duration-300
                focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10
                ${
                  errors.password
                    ? "border-red-500"
                    : "border-white/10 hover:border-white/20"
                }
              `}
            />

            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.password && (
            <p className="mt-2 text-xs text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Optional Forgot Password */}
        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="
            mt-2 w-full rounded-xl py-3
            bg-gradient-to-r from-cyan-500 to-blue-600
            text-white font-semibold
            shadow-lg shadow-cyan-500/25
            transition-all duration-300
            hover:scale-[1.02]
            active:scale-[0.98]
            disabled:opacity-50
            flex items-center justify-center gap-2
          "
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              <ArrowRight size={18} />
              Sign In
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        No account?{" "}
        <Link
          to="/register"
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
