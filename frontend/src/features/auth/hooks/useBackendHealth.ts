import { useEffect, useState } from "react";

type HealthStatus = "ok" | "degraded" | "checking" | "unreachable";

const HEALTH_URL = (() => {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (import.meta.env.DEV) return "/health";
  if (base) {
    const origin = new URL(base).origin;
    return `${origin}/health`;
  }
  return "https://open-format-3d-viewer.onrender.com/health";
})();

export function useBackendHealth() {
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (localStorage.getItem("use_mock_api") === "true") {
        setStatus("ok");
        setDetail("Mock API Mode Active");
        return;
      }

      try {
        const res = await fetch(HEALTH_URL);
        if (cancelled) return;

        const json = await res.json().catch(() => null);
        const dbStatus = json?.data?.db ?? "unknown";

        if (!res.ok || dbStatus !== "ok") {
          setStatus("degraded");
          setDetail(
            dbStatus === "unavailable"
              ? "Database unavailable"
              : json?.data?.status ?? "Service degraded"
          );
        } else {
          setStatus("ok");
          setDetail("");
        }
      } catch {
        if (!cancelled) {
          setStatus("unreachable");
          setDetail("Cannot reach server");
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, detail };
}
