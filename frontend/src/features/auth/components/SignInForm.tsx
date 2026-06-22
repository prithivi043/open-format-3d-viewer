import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema, type SigninFormData } from "../schemas/authSchema";
import { useSignin } from "../hooks/useSignin";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import GoogleIcon from "../components/GoogleIcon";

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

  const inputCls = (hasError: boolean) => `
    w-full rounded-lg border px-4 py-3 text-[15px] text-gray-900 bg-white
    placeholder:text-gray-400 outline-none transition-all duration-200
    hover:border-gray-400
    focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
    ${
      hasError
        ? "border-red-400 focus:ring-red-500/20 focus:border-red-400"
        : "border-gray-300"
    }
  `;

  // VITE_API_BASE_URL = "https://open-format-3d-viewer.onrender.com/v1"
  // so auth/google lives at: VITE_API_BASE_URL + "/auth/google"  (no extra /v1)
  const googleAuthUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;

  return (
    <div className="text-gray-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-gray-900">
          Welcome Back!
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">Login to your Account</p>
      </div>

      {mutation.isError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {(mutation.error as Error)?.message ?? "Sign in failed. Try again."}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            {...register("email")}
            className={inputCls(!!errors.email)}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register("password")}
              className={`${inputCls(!!errors.password)} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="
            flex w-full items-center justify-center gap-2 rounded-lg py-3
            bg-gradient-to-r from-violet-600 to-purple-700
            text-[15px] font-semibold text-white
            shadow-md shadow-violet-500/25
            transition-all duration-200
            hover:from-violet-700 hover:to-purple-800
            active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Signing in…
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or continue with</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Google — direct navigation, no proxy needed for OAuth */}
      <a
        href={googleAuthUrl}
        className="
          flex w-full items-center justify-center gap-3
          rounded-lg border border-gray-300 bg-white py-3
          text-sm font-medium text-gray-700 shadow-sm
          hover:bg-gray-50 hover:border-gray-400
          transition-all duration-200
        "
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
