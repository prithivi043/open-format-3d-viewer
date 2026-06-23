import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const FORMAT_ICONS = [
  { label: "IFC", color: "#E74C3C" },
  { label: "STEP", color: "#3498DB" },
  { label: "GLTF", color: "#27AE60" },
  { label: "OBJ", color: "#9B59B6" },
  { label: "STL", color: "#F39C12" },
];

function FileIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="24" viewBox="0 0 22 26" fill="none">
      <path
        d="M2 0h11l7 7v19H2V0z"
        fill={`${color}22`}
        stroke={color}
        strokeWidth="1.2"
      />
      <path d="M13 0v7h7" stroke={color} strokeWidth="1.2" />
      <rect x="5" y="12" width="10" height="1.4" rx="0.7" fill={color} />
      <rect
        x="5"
        y="16"
        width="7"
        height="1.4"
        rx="0.7"
        fill={color}
        opacity="0.5"
      />
    </svg>
  );
}

function WireCubeLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
      <rect
        x="4"
        y="18"
        width="18"
        height="18"
        stroke="#22d3ee"
        strokeWidth="1.4"
      />
      <path d="M4 18 L13 9 L31 9 L22 18" stroke="#22d3ee" strokeWidth="1.4" />
      <path d="M22 18 L31 9 L31 27 L22 36" stroke="#22d3ee" strokeWidth="1.4" />
      <circle cx="31" cy="9" r="2" fill="#22d3ee" />
    </svg>
  );
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex bg-[#0A0D1A] text-white">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col w-[56%] xl:w-[58%] relative overflow-hidden px-12 xl:px-14 py-7">
        <div className="pointer-events-none absolute -top-28 -left-28 w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-cyan-700/15 blur-[80px]" />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.75) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-9">
          <WireCubeLogo />
          <div>
            <p className="text-[16px] font-semibold tracking-[-0.02em] leading-none">
              Open Format
            </p>
            <p className="text-[10px] font-medium text-slate-500 tracking-[0.18em] uppercase mt-1">
              3D VIEWER
            </p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative">
          <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500 mb-3 block">
            All-In-One 3D Platform
          </span>

          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.02] tracking-[-0.04em]">
            View.
            <br />
            Collaborate.
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
              Build Better.
            </span>
          </h1>

          <p className="mt-4 text-[13px] text-slate-400 leading-relaxed max-w-[280px]">
            Upload, visualize and collaborate on IFC, STEP, STL and GLTF models
            in real time.
          </p>
        </div>

        {/* Format badges */}
        <div className="relative mt-8 flex items-end gap-4">
          {FORMAT_ICONS.map(({ label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className="w-[42px] h-[42px] rounded-xl flex items-center justify-center border border-white/10"
                style={{ backgroundColor: `${color}1A` }}
              >
                <FileIcon color={color} />
              </div>
              <span className="text-[8px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Building Illustration */}
        <div className="relative mt-auto flex justify-end pr-6">
          <div className="absolute bottom-0 right-14 w-48 h-6 bg-purple-600/25 blur-2xl rounded-full" />

          <svg width="220" height="150" viewBox="0 0 260 190" fill="none">
            <ellipse
              cx="130"
              cy="184"
              rx="95"
              ry="6"
              fill="rgba(124,58,237,0.12)"
            />
            <path
              d="M35 148 L130 96 L225 148 L225 180 L35 180 Z"
              fill="rgba(124,58,237,0.06)"
              stroke="rgba(124,58,237,0.45)"
            />
            <path
              d="M35 148 L130 96 L225 148"
              stroke="rgba(167,139,250,0.75)"
              strokeWidth="1.2"
            />
            <circle cx="130" cy="96" r="3" fill="rgba(167,139,250,0.95)" />
          </svg>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-8 min-h-screen">
        <div className="w-full max-w-[390px]">{children}</div>
      </div>
    </div>
  );
}
