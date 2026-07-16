import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useViewerStore } from "../store/viewerStore";
import { useViewerContext } from "../context/ViewerProvider";
import { MessageSquare, X, Check, Share2, Copy } from "lucide-react";

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
        <text x="33" y="7" fontSize="9" fill="#60a5fa" fontWeight="bold">
          Z
        </text>
        {/* Y - Green */}
        <line
          x1="32"
          y1="32"
          x2="54"
          y2="50"
          stroke="#16a34a"
          strokeWidth="2"
        />
        <polygon points="58,53 48,50 54,42" fill="#16a34a" />
        <text x="55" y="56" fontSize="9" fill="#4ade80" fontWeight="bold">
          Y
        </text>
        {/* X - Red */}
        <line
          x1="32"
          y1="32"
          x2="10"
          y2="50"
          stroke="#dc2626"
          strokeWidth="2"
        />
        <polygon points="6,53 16,50 10,42" fill="#dc2626" />
        <text x="2" y="56" fontSize="9" fill="#f87171" fontWeight="bold">
          X
        </text>
      </svg>
    </div>
  );
}

// Mock 3D building rendered via CSS perspective
function MockBuilding({
  rotation,
  selectedFloor,
  onSelectFloor,
  sectionHeight,
}: {
  rotation: number;
  selectedFloor: string | null;
  onSelectFloor: (label: string) => void;
  sectionHeight: number; // 0 to 100
}) {
  const floors = [
    {
      y: 0,
      color: "rgba(139,92,246,0.15)",
      border: "rgba(139,92,246,0.5)",
      label: "L1",
      threshold: 10,
    },
    {
      y: -70,
      color: "rgba(99,102,241,0.12)",
      border: "rgba(99,102,241,0.4)",
      label: "L2",
      threshold: 45,
    },
    {
      y: -130,
      color: "rgba(59,130,246,0.10)",
      border: "rgba(59,130,246,0.35)",
      label: "L3",
      threshold: 75,
    },
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
        {floors.map((floor, i) => {
          const isVisible = sectionHeight >= floor.threshold;
          const isSelected = selectedFloor === floor.label;

          return (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFloor(floor.label);
              }}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 200 - i * 20,
                height: 200 - i * 20,
                marginLeft: -(100 - i * 10),
                marginTop: -(100 - i * 10) + floor.y,
                background: isSelected ? "rgba(139,92,246,0.4)" : floor.color,
                border: `2px solid ${isSelected ? "#a78bfa" : floor.border}`,
                borderRadius: 6,
                boxShadow: isSelected
                  ? "0 0 40px #a78bfa"
                  : `0 0 30px ${floor.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                pointerEvents: "auto",
                transition:
                  "opacity 0.3s ease, background 0.2s, border-color 0.2s",
                opacity: isVisible ? 1 : 0,
              }}
            >
              <span
                style={{
                  color: isSelected ? "#ffffff" : floor.border,
                  fontSize: 11,
                  fontWeight: 700,
                  opacity: 0.9,
                }}
              >
                {floor.label}
              </span>
            </div>
          );
        })}

        {/* Vertical columns — only show if section height allows */}
        {(
          [
            [-90, -90],
            [90, -90],
            [-90, 90],
            [90, 90],
          ] as const
        ).map(([x, z], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 4,
              height: 140 * (sectionHeight / 100),
              marginLeft: x - 2,
              marginTop: -10 + 140 * (1 - sectionHeight / 100),
              background:
                "linear-gradient(180deg, rgba(139,92,246,0.6), rgba(99,102,241,0.2))",
              borderRadius: 2,
              transform: `translateZ(${z}px)`,
              transition: "height 0.1s, marginTop 0.1s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ViewerCanvas() {
  const {
    activeTool,
    loadingProgress,
    selectedObjectId,
    setSelectedObjectId,
    setSelectedProperties,
    annotations,
    addAnnotation,
    annotationModal,
    setAnnotationModal,
    userRole,
  } = useViewerStore();

  const {
    canvasRef,
    isRealModel,
    modelId,
    addRealModelAnnotation,
    peerCursors,
    sendMessage,
    isConnected,
  } = useViewerContext();

  const [rotation, setRotation] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulated measure tool points
  const [measurePoints, setMeasurePoints] = useState<
    { x: number; y: number }[]
  >([]);

  // Simulated section clipping level (0 to 100)
  const [sectionHeight, setSectionHeight] = useState(100);
  const [isClippingDragging, setIsClippingDragging] = useState(false);

  // Custom Toast notification states
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Custom Share modal visible state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Input value for custom annotation dialog
  const [annotationInput, setAnnotationInput] = useState("");

  // Listen to share-toast and open-share-modal events
  useEffect(() => {
    const handleShareToast = () => {
      setToastMessage("Project view link copied to clipboard!");
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    };

    const handleAnnotationToast = () => {
      setToastMessage("Click a point on the model to place a pin");
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    };

    const handleOpenShareModal = () => {
      setIsShareModalOpen(true);
    };

    window.addEventListener("show-share-toast", handleShareToast);
    window.addEventListener("show-annotation-toast", handleAnnotationToast);
    window.addEventListener("open-share-modal", handleOpenShareModal);

    return () => {
      window.removeEventListener("show-share-toast", handleShareToast);
      window.removeEventListener("show-annotation-toast", handleAnnotationToast);
      window.removeEventListener("open-share-modal", handleOpenShareModal);
    };
  }, []);

  // Listen for canvas sync updates from peers
  useEffect(() => {
    const handleSyncMeasure = (e: Event) => {
      const pts = (e as CustomEvent).detail;
      setMeasurePoints(pts);
    };

    const handleSyncSection = (e: Event) => {
      const { height } = (e as CustomEvent).detail;
      setSectionHeight(height);
    };

    const handleSyncSelect = (e: Event) => {
      const objId = (e as CustomEvent).detail;
      setSelectedObjectId(objId);

      if (!isRealModel) {
        if (objId) {
          const floor = objId.replace("mock-slab-", "");
          handleSelectMockFloor(floor);
        } else {
          setSelectedObjectId(null);
          setSelectedProperties(null);
        }
      }
    };

    window.addEventListener("sync-measure-points", handleSyncMeasure);
    window.addEventListener("sync-section", handleSyncSection);
    window.addEventListener("sync-select", handleSyncSelect);

    return () => {
      window.removeEventListener("sync-measure-points", handleSyncMeasure);
      window.removeEventListener("sync-section", handleSyncSection);
      window.removeEventListener("sync-select", handleSyncSelect);
    };
  }, [isRealModel, setSelectedObjectId, setSelectedProperties]);

  // Broadcast local measurement changes to peers
  useEffect(() => {
    if (activeTool === "measure" && measurePoints.length > 0 && isConnected) {
      sendMessage("MODEL_SYNC", { type: "MEASURE_UPDATE", points: measurePoints });
    }
  }, [measurePoints, activeTool, isConnected, sendMessage]);

  // Broadcast local section cuts to peers
  useEffect(() => {
    if (activeTool === "section" && isConnected) {
      sendMessage("MODEL_SYNC", { type: "SECTION_UPDATE", height: sectionHeight });
    }
  }, [sectionHeight, activeTool, isConnected, sendMessage]);

  // Broadcast local object selection to peers
  useEffect(() => {
    if (activeTool === "select" && selectedObjectId && isConnected) {
      sendMessage("MODEL_SYNC", { type: "SELECT_UPDATE", objectId: selectedObjectId });
    }
  }, [selectedObjectId, activeTool, isConnected, sendMessage]);

  // Auto rotate when not dragging
  useEffect(() => {
    let animId: number;
    const tick = () => {
      if (!isDragging && activeTool === "orbit") {
        setRotation((r) => r + 0.15);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isDragging, activeTool]);

  // Clean up measurements on tool changes
  useEffect(() => {
    setMeasurePoints([]);
  }, [activeTool]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (annotationModal.isOpen) return;
    if (activeTool === "orbit" || activeTool === "pan") {
      setIsDragging(true);
      lastX.current = e.clientX;
    } else if (activeTool === "select") {
      // Clear selection if clicking empty canvas space in mock mode
      const target = e.target as HTMLElement;
      if (target === containerRef.current && !isRealModel) {
        setSelectedObjectId(null);
        setSelectedProperties(null);
      }
    } else if (activeTool === "measure" && containerRef.current && userRole !== "viewer") {
      const rect = containerRef.current.getBoundingClientRect();
      const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (measurePoints.length >= 2) {
        setMeasurePoints([pt]);
      } else {
        setMeasurePoints([...measurePoints, pt]);
      }
    } else if (
      activeTool === "annotation" &&
      containerRef.current &&
      !isRealModel &&
      userRole !== "viewer"
    ) {
      const rect = containerRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

      // Trigger custom Zustand annotation modal for mock mode
      setAnnotationModal({
        isOpen: true,
        worldPos: null,
        entityId: null,
        mockScreenPos: [xPercent, yPercent],
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastX.current;
      setRotation((r) => r + dx * 0.4);
      lastX.current = e.clientX;
    } else if (isClippingDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const yPercent = 100 - ((e.clientY - rect.top) / rect.height) * 100;
      setSectionHeight(Math.max(0, Math.min(100, yPercent)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsClippingDragging(false);
  };

  // Mock slab property selection
  const handleSelectMockFloor = (label: string) => {
    setSelectedObjectId("mock-slab-" + label);
    setSelectedProperties({
      elementName: "Slab " + label,
      ifcType: "IfcSlab",
      globalModelId: "mock-slab-" + label,
      attributes: [
        { label: "Nominal Thickness", value: "300 mm", group: "Dimensions" },
        { label: "Area", value: "40.2 m²", group: "Dimensions" },
        { label: "Material", value: "Concrete - C30/37", group: "Materials" },
        { label: "Level", value: label, group: "Location" },
      ],
    });
  };

  // Save the custom annotation input
  const handleSaveAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annotationInput.trim()) return;

    if (annotationModal.mockScreenPos) {
      // Mock mode annotation creation
      addAnnotation({
        id: "mock-anno-" + Date.now(),
        modelId: modelId || "mock-model",
        positionXyz: [
          annotationModal.mockScreenPos[0],
          annotationModal.mockScreenPos[1],
          0,
        ],
        normalXyz: [0, 0, 1],
        message: annotationInput.trim(),
        status: "open",
        createdAt: new Date().toISOString(),
      });
    } else if (annotationModal.worldPos && annotationModal.entityId) {
      // Real mode annotation creation
      addRealModelAnnotation(
        annotationModal.worldPos,
        annotationModal.entityId,
        annotationInput.trim(),
        annotationModal.worldNormal || undefined,
      );
    }

    // Reset and close
    setAnnotationInput("");
    setAnnotationModal({
      isOpen: false,
      worldPos: null,
      entityId: null,
      mockScreenPos: null,
    });
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

  const p1 = measurePoints[0];
  const p2 = measurePoints[1];
  const distance =
    p1 && p2
      ? Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
      : 0;
  const meters = (distance * 0.05).toFixed(2) + " m";

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 select-none overflow-hidden ${userRole !== "admin" ? "viewer-non-admin" : ""}`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, rgba(30,20,60,0.9) 0%, rgba(8,10,26,1) 70%)",
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
          backgroundImage:
            "radial-gradient(circle, rgba(139,92,246,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Real WebGL canvas container (Establishes a strict stacking context for xeokit markers) */}
      <div className="absolute inset-0 z-0" style={{ isolation: 'isolate' }}>
        <canvas
          ref={canvasRef}
          id="xeokit-canvas"
          className={`absolute inset-0 w-full h-full ${isRealModel ? "block" : "hidden"}`}
        />
      </div>

      {/* Mock Building */}
      {loadingProgress === 100 && !isRealModel && (
        <MockBuilding
          rotation={rotation}
          selectedFloor={
            selectedObjectId ? selectedObjectId.replace("mock-slab-", "") : null
          }
          onSelectFloor={handleSelectMockFloor}
          sectionHeight={sectionHeight}
        />
      )}

      {/* Mock Measurement SVG Layer */}
      {activeTool === "measure" && !isRealModel && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {measurePoints.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill="#22d3ee"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          ))}
          {p1 && p2 && (
            <>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
              <rect
                x={(p1.x + p2.x) / 2 - 28}
                y={(p1.y + p2.y) / 2 - 12}
                width="56"
                height="20"
                rx="6"
                fill="#0f172a"
                stroke="#22d3ee"
                strokeWidth="1"
              />
              <text
                x={(p1.x + p2.x) / 2}
                y={(p1.y + p2.y) / 2 + 2}
                textAnchor="middle"
                fill="#22d3ee"
                fontSize="10"
                fontWeight="bold"
              >
                {meters}
              </text>
            </>
          )}
        </svg>
      )}

      {/* Mock Section Slider (Horizontal cut helper) */}
      {activeTool === "section" && !isRealModel && (
        <div
          className="absolute left-0 right-0 z-30 flex items-center justify-center cursor-row-resize"
          style={{ bottom: `${sectionHeight}%`, height: 4 }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsClippingDragging(true);
          }}
        >
          <div className="w-full h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
              Section Plane: {Math.round(sectionHeight)}%
            </div>
          </div>
        </div>
      )}

      {/* Mock Annotations Layer */}
      {!isRealModel &&
        annotations.map((anno, i) => {
          const [left, top] = anno.positionXyz;
          if (left === undefined || top === undefined) return null;

          return (
            <div
              key={anno.id}
              className="absolute z-20"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div title={anno.message} className="xeokit-annotation-marker">
                {i + 1}
              </div>
              <div className="xeokit-annotation-label">
                <div className="flex justify-between items-start gap-2">
                  <div className="xeokit-annotation-title">
                    Observation #{i + 1}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = annotations.filter((a) => a.id !== anno.id);
                      useViewerStore.getState().setAnnotations(next);
                    }}
                    className="text-red-400 hover:text-red-600 font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="xeokit-annotation-desc">{anno.message}</div>
              </div>
            </div>
          );
        })}

      {/* Sleek Custom Toast Popup (Replaces Browser alert() for sharing) */}
      {createPortal(
        <div
        className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-[#0f172a]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md transition-all duration-300 ${
          toastVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check size={12} className="text-emerald-400 font-bold" />
        </div>
        <span className="text-xs text-gray-200 font-medium">
          {toastMessage}
        </span>
      </div>,
      document.body
      )}

      {/* Custom Annotation Dialog (Replaces native browser prompt()) */}
      {annotationModal.isOpen && createPortal(
        <div className="absolute inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form
            onSubmit={handleSaveAnnotation}
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0f172a]/95 p-5 shadow-2xl text-left backdrop-blur-md"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-white">
                  Create Annotation
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAnnotationModal({
                    isOpen: false,
                    worldPos: null,
                    entityId: null,
                    mockScreenPos: null,
                  })
                }
                className="text-slate-400 hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            <div className="my-4">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Issue Description
              </label>
              <textarea
                required
                rows={3}
                autoFocus
                value={annotationInput}
                onChange={(e) => setAnnotationInput(e.target.value)}
                placeholder="e.g. Structural cracking observed on slab boundary."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setAnnotationModal({
                    isOpen: false,
                    worldPos: null,
                    entityId: null,
                    mockScreenPos: null,
                  })
                }
                className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-violet-500 transition focus:ring-2 focus:ring-violet-500/50"
              >
                Create Tag
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Sleek Custom Share Modal dialog */}
      {isShareModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0f172a]/95 p-6 shadow-2xl text-left backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white">
                  Share Project View
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-slate-400 my-4 leading-relaxed">
              Anyone with this link can view the current 3D model, annotations,
              and project status online.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-300 outline-none select-all"
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    const input = document.createElement("input");
                    input.value = window.location.href;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand("copy");
                    document.body.removeChild(input);
                  } catch {
                    navigator.clipboard.writeText(window.location.href);
                  }
                  setIsShareModalOpen(false);
                  setToastMessage("Project view link copied to clipboard!");
                  setToastVisible(true);
                  setTimeout(() => setToastVisible(false), 3000);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white px-4 py-2 transition shrink-0"
              >
                <Copy size={13} />
                Copy Link
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
            <p className="text-[12px] text-gray-300 font-medium">
              Loading Model
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {Math.round(loadingProgress)}% complete
            </p>
          </div>
        </div>
      )}

      {/* Peer Cursors Layer */}
      {isRealModel &&
        Object.entries(peerCursors || {}).map(([id, peer]) => {
          if (!peer.screenPos) return null;
          const [left, top] = peer.screenPos;
          return (
            <div
              key={id}
              className="absolute pointer-events-none transition-all duration-75 z-40"
              style={{ left, top }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4.5 3v15.2l4-4 3 6.8 2.2-1-3-6.8h6L4.5 3z"
                  fill={peer.avatarColor}
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              <div
                className="absolute left-4 top-4 px-2 py-0.5 rounded text-[10px] text-white font-medium whitespace-nowrap"
                style={{ backgroundColor: peer.avatarColor }}
              >
                {peer.name}
              </div>
            </div>
          );
        })}

      {!isRealModel && <AxisIndicator />}

      {/* Tool hint */}
      {loadingProgress === 100 && (
        <div
          className="absolute bottom-12 right-3 px-2 py-1 rounded text-[9px] text-gray-500"
          style={{ background: "rgba(8,10,26,0.6)" }}
        >
          {activeTool === "orbit"
            ? "Drag to orbit"
            : activeTool === "pan"
              ? "Drag to pan"
              : activeTool === "select"
                ? "Click to select element"
                : activeTool === "annotation"
                  ? "Click to place annotation"
                  : activeTool === "measure"
                    ? "Click two points to measure"
                    : activeTool === "section"
                      ? "Drag to cut section"
                      : ""}
        </div>
      )}
    </div>
  );
}
