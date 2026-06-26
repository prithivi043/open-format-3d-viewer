import { useEffect, useRef, useState } from "react";
import { useViewerStore } from "../store/viewerStore";
import { useViewerContext } from "../context/ViewerProvider";

// Axis indicator component (XYZ colored arrows like xeokit)
function AxisIndicator() {
  return (
    <div
      className="absolute bottom-12 left-[210px] z-10 pointer-events-none"
      style={{ width: 64, height: 64 }}
    >
      <svg viewBox="0 0 64 64" width="64" height="64">
        {/* Z - Blue */}
        <line x1="32" y1="32" x2="32" y2="8" stroke="#2563eb" strokeWidth="2" />
        <polygon points="32,4 28,12 36,12" fill="#2563eb" />
        <text x="33" y="7" fontSize="9" fill="#60a5fa" fontWeight="bold">Z</text>
        {/* Y - Green */}
        <line x1="32" y1="32" x2="54" y2="50" stroke="#16a34a" strokeWidth="2" />
        <polygon points="58,53 48,50 54,42" fill="#16a34a" />
        <text x="55" y="56" fontSize="9" fill="#4ade80" fontWeight="bold">Y</text>
        {/* X - Red */}
        <line x1="32" y1="32" x2="10" y2="50" stroke="#dc2626" strokeWidth="2" />
        <polygon points="6,53 16,50 10,42" fill="#dc2626" />
        <text x="2" y="56" fontSize="9" fill="#f87171" fontWeight="bold">X</text>
      </svg>
    </div>
  );
}

// Mock 3D building rendered via CSS perspective
function MockBuilding({ rotation }: { rotation: number }) {
  const floors = [
    { y: 0, color: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.5)", label: "L1" },
    { y: -70, color: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.4)", label: "L2" },
    { y: -130, color: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.35)", label: "L3" },
  ];

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ perspective: "800px" }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(30deg) rotateY(${rotation}deg)`,
          transition: "transform 0.05s linear",
          width: 280,
          height: 280,
          position: "relative",
        }}
      >
        {floors.map((floor, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 200 - i * 20,
              height: 200 - i * 20,
              marginLeft: -(100 - i * 10),
              marginTop: -(100 - i * 10) + floor.y,
              background: floor.color,
              border: `1px solid ${floor.border}`,
              borderRadius: 4,
              boxShadow: `0 0 30px ${floor.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: floor.border, fontSize: 11, fontWeight: 700, opacity: 0.8 }}>
              {floor.label}
            </span>
          </div>
        ))}

        {/* Vertical edges / columns */}
        {([[-90, -90], [90, -90], [-90, 90], [90, 90]] as const).map(([x, z], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 4,
              height: 140,
              marginLeft: x - 2,
              marginTop: -10,
              background: "linear-gradient(180deg, rgba(139,92,246,0.6), rgba(99,102,241,0.2))",
              borderRadius: 2,
              transform: `translateZ(${z}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ViewerCanvas() {
  const { activeTool, loadingProgress } = useViewerStore();
  const { canvasRef, isRealModel } = useViewerContext();
  const [rotation, setRotation] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);
  const animRef = useRef<number | null>(null);
  const isAutoRotating = useRef(true);

  // Auto rotate when not dragging
  useEffect(() => {
    const tick = () => {
      if (isAutoRotating.current && !isDragging) {
        setRotation((r) => r + 0.15);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "orbit" || activeTool === "pan") {
      setIsDragging(true);
      isAutoRotating.current = false;
      lastX.current = e.clientX;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX.current;
    setRotation((r) => r + dx * 0.4);
    lastX.current = e.clientX;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => { isAutoRotating.current = true; }, 3000);
  };

  const cursorMap: Record<string, string> = {
    orbit: "grab",
    pan: "move",
    zoom: "zoom-in",
    select: "crosshair",
    measure: "crosshair",
    annotation: "cell",
    section: "col-resize",
  };

  return (
    <div
      className="absolute inset-0"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, rgba(30,20,60,0.9) 0%, rgba(8,10,26,1) 70%)",
        cursor: cursorMap[activeTool] || "default",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid dots */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Real WebGL canvas */}
      <canvas
        ref={canvasRef}
        id="xeokit-canvas"
        className={`absolute inset-0 w-full h-full ${isRealModel ? "block" : "hidden"}`}
      />

      {/* Building */}
      {loadingProgress === 100 && !isRealModel && <MockBuilding rotation={rotation} />}

      {/* Loading overlay */}
      {loadingProgress < 100 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            <div
              className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
            <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[12px] text-gray-300 font-medium">Loading Model</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{Math.round(loadingProgress)}% complete</p>
          </div>
        </div>
      )}

      <AxisIndicator />

      {/* Tool hint */}
      {loadingProgress === 100 && (
        <div
          className="absolute bottom-12 right-3 px-2 py-1 rounded text-[9px] text-gray-500"
          style={{ background: "rgba(8,10,26,0.6)" }}
        >
          {activeTool === "orbit" ? "Drag to orbit" :
           activeTool === "pan" ? "Drag to pan" :
           activeTool === "select" ? "Click to select element" :
           activeTool === "annotation" ? "Click to place annotation" :
           activeTool === "measure" ? "Click two points to measure" :
           activeTool === "section" ? "Drag to cut section" : ""}
        </div>
      )}
    </div>
  );
}

