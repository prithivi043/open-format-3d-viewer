import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  const setLoading = useAuthStore((s) => s.setLoading);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0D1A] text-white">
        <svg
          className="animate-spin mr-3"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="rgba(167,139,250,0.25)"
            strokeWidth="2.5"
          />
          <path
            d="M10 2 A8 8 0 0 1 18 10"
            stroke="#a78bfa"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm text-slate-400">Loading session…</span>
      </div>
    );
  }

  return <>{children}</>;
}
