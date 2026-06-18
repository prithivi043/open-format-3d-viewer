import type { ReactNode } from "react";
import { Box, Zap, ScanSearch } from "lucide-react";

interface Props {
  children: ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="h-screen bg-[#060816] text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-cyan-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 h-screen grid lg:grid-cols-2">
        {/* Left */}
        <div className="hidden lg:flex flex-col justify-center px-12 xl:px-16">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
            Build Open Format
            <span className="block bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              3D Viewer
            </span>
          </h1>

          <p className="mt-3 text-slate-400 text-base max-w-lg">
            Upload, inspect and interact with complex 3D models in multiple open
            formats.
          </p>

          {/* Features */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <Box size={20} className="text-cyan-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">Open Format Support</p>
                <p className="text-xs text-slate-500">glTF, OBJ, STL, IFC</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Zap size={20} className="text-purple-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">Real-time Rendering</p>
                <p className="text-xs text-slate-500">
                  Smooth large model interaction
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ScanSearch size={20} className="text-blue-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">Inspect & Collaborate</p>
                <p className="text-xs text-slate-500">
                  Analyze geometry precisely
                </p>
              </div>
            </div>
          </div>

          <div className="group relative mt-6 w-[250px] h-[250px] flex items-center justify-center cursor-pointer">
            {/* Platform */}
            <div className="absolute bottom-6 w-44 h-10 rounded-full bg-gradient-to-r from-cyan-500/50 to-purple-500/50 blur-lg" />
            <div className="absolute bottom-6 w-40 h-8 rounded-full border border-cyan-400/40 bg-white/5 backdrop-blur-xl" />

            {/* Orbit Rings */}
            <div className="absolute w-52 h-52 border border-cyan-400/20 rounded-full animate-spin group-hover:[animation-play-state:paused]" />
            <div className="absolute w-40 h-40 border border-purple-400/20 rounded-full animate-[spin_6s_linear_infinite_reverse] group-hover:[animation-play-state:paused]" />

            {/* Real 3D Cube */}
            <div className="relative w-20 h-20 rotate-3d">
              {/* Front */}
              <div className="absolute inset-0 bg-cyan-400/80 border border-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.5)] [transform:translateZ(40px)]" />

              {/* Back */}
              <div className="absolute inset-0 bg-purple-500/40 border border-purple-400 [transform:rotateY(180deg)_translateZ(40px)]" />

              {/* Left */}
              <div className="absolute inset-0 bg-blue-500/50 border border-blue-400 [transform:rotateY(-90deg)_translateZ(40px)]" />

              {/* Right */}
              <div className="absolute inset-0 bg-indigo-500/50 border border-indigo-400 [transform:rotateY(90deg)_translateZ(40px)]" />

              {/* Top */}
              <div className="absolute inset-0 bg-cyan-300/40 border border-cyan-200 [transform:rotateX(90deg)_translateZ(40px)]" />

              {/* Bottom */}
              <div className="absolute inset-0 bg-purple-400/40 border border-purple-300 [transform:rotateX(-90deg)_translateZ(40px)]" />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-cyan-500/10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
