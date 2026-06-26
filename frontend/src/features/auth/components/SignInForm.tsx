import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema, type SigninFormData } from "../schemas/authSchema";
import { useSignin } from "../hooks/useSignin";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import GoogleIcon from "../components/GoogleIcon";
import { getGoogleAuthUrl } from "../api/authApi";
import { useBackendHealth } from "../hooks/useBackendHealth";

export default function SignInForm() {
  const mutation = useSignin();
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");
  const signupSuccess = searchParams.get("registered") === "success";
  const { status: serverStatus, detail: serverDetail } = useBackendHealth();

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

  const googleAuthUrl = getGoogleAuthUrl();

  return (
    <div className="text-gray-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-gray-900">
          Welcome Back!
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">Login to your Account</p>
      </div>

      {/* Mock Mode success banner */}
      {localStorage.getItem("use_mock_api") === "true" && (
        <div className="mb-5 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">✨</span>
            <span>
              <strong>Mock API Mode Active:</strong> You are using a simulated local database. All login, signup, project, and model features will work offline.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("use_mock_api");
              localStorage.removeItem("mock_current_user");
              window.location.reload();
            }}
            className="mt-1 self-start rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Switch to Real Backend
          </button>
        </div>
      )}

      {/* Server health banner */}
      {localStorage.getItem("use_mock_api") !== "true" && (serverStatus === "degraded" || serverStatus === "unreachable") && (
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-800 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>
              <strong>Server issue:</strong> {serverDetail || "The server is currently experiencing problems."} Sign-in may not work right now.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("use_mock_api", "true");
              window.location.reload();
            }}
            className="mt-1 self-start rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            Enable Mock API Mode (Offline Test)
          </button>
        </div>
      )}

      {signupSuccess && (
        <div className="mb-5 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 flex items-start gap-2">
          <span className="mt-0.5 shrink-0">🎉</span>
          <span>
            <strong>Account created successfully!</strong> Please log in below with your email and password.
          </span>
        </div>
      )}

      {(mutation.isError || oauthError) && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {oauthError === "oauth_failed"
            ? "Google sign-in failed. Please try again."
            : oauthError
              ? decodeURIComponent(oauthError)
              : (mutation.error as Error)?.message ?? "Sign in failed. Try again."}
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
