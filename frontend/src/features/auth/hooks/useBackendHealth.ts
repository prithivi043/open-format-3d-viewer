import { useEffect, useState } from "react";

type HealthStatus = "ok" | "degraded" | "checking" | "unreachable";

// Always use a relative path — both Vite's dev proxy and Vercel's rewrite rules
// forward /health → Render backend, avoiding cross-origin CORS preflight requests.
const HEALTH_URL = "/health";

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
