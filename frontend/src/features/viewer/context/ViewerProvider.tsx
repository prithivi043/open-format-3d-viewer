/**
 * ViewerProvider.tsx
 *
 * Root issue fix: xeokit's default data source uses XMLHttpRequest which
 * automatically appends ?_=<timestamp> cache-busters to every URL.
 * Browsers REJECT blob:// URLs that have query parameters → ERR_FILE_NOT_FOUND.
 *
 * Solution: LocalFetchDataSource uses the Fetch API which:
 *    Loads blob:// URLs correctly with no modifications
 *    Works for .ifc, .glb, .gltf, .xkt
 *    Never appends cache-busting parameters
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useViewerStore } from "../store/viewerStore";

import { localModelStore } from "../../../lib/localModelStore";
import { useWebSocket, type WSEvent } from "../../../hooks/useWebSocket";
import { updateLabelLayout } from "../utils/labelLayout";
import {
  getAnnotations,
  createAnnotation,
  deleteAnnotation,
} from "../../models/api/annotationApi";
import type {
  IFCNode,
  PropertyRow,
  AnnotationIssue,
} from "../types/viewer.types";
import type { Annotation, CreateAnnotationPayload } from "../../models/types/model.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true when `id` is a valid UUID (v4-style), i.e. a backend model ID. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isBackendModelId(id: string): boolean {
  return UUID_RE.test(id);
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ViewerContextValue {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  modelId: string;
  isRealModel: boolean;
  goHome: () => void;
  fitToView: () => void;
  toggleSettings: () => void;
  shareView: () => void;
  addRealModelAnnotation: (
    worldPos: [number, number, number],
    entityId: string,
    message: string,
    worldNormal?: [number, number, number],
  ) => void;
  peerCursors: Record<
    string,
    {
      position: [number, number, number];
      name: string;
      avatarColor: string;
      screenPos?: [number, number];
    }
  >;
  sendMessage: (event: string, data: unknown) => void;
}

const ViewerContext = createContext<ViewerContextValue | null>(null);

export function useViewerContext() {
  const ctx = useContext(ViewerContext);
  if (!ctx)
    throw new Error("useViewerContext must be used inside ViewerProvider");
  return ctx;
}

// ─── Custom Fetch-based Data Source ──────────────────────────────────────────

class LocalFetchDataSource {
  cacheBuster = false;

  private _buf(src: string): Promise<ArrayBuffer> {
    const cleanSrc = src.startsWith("blob:") ? src.split("?")[0] : src;
    if (!cleanSrc) return Promise.reject(new Error("Empty src"));
    return fetch(cleanSrc).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} loading model`);
      return r.arrayBuffer();
    });
  }

  getIFC(src: string, ok: (d: ArrayBuffer) => void, err: (e: Error) => void) {
    this._buf(src).then(ok).catch(err);
  }

  getXKT(src: string, ok: (d: ArrayBuffer) => void, err: (e: Error) => void) {
    this._buf(src).then(ok).catch(err);
  }

  getGLTF(src: string, ok: (d: ArrayBuffer) => void, err: (e: Error) => void) {
    this._buf(src).then(ok).catch(err);
  }

  getGLTFBin(
    src: string,
    ok: (d: ArrayBuffer) => void,
    err: (e: Error) => void,
  ) {
    this._buf(src).then(ok).catch(err);
  }

  getGLTFJSON(
    src: string,
    ok: (d: ArrayBuffer) => void,
    err: (e: Error) => void,
  ) {
    this._buf(src).then(ok).catch(err);
  }
}

// ─── xeokit duck-type helpers ─────────────────────────────────────────────────

type MetaObjectLike = {
  id: string;
  name?: string;
  type?: string;
  propertySets?: {
    name?: string;
    properties?: { name: string; value: unknown }[];
  }[];
  children?: MetaObjectLike[];
};

type MetaModelLike = {
  rootMetaObjects?: MetaObjectLike[];
  metaObjects?: Record<string, MetaObjectLike>;
};

interface PickResult {
  entity?: { id?: string };
  worldPos?: number[];
  worldNormal?: number[];
}

interface CameraLike {
  eye: number[];
  look: number[];
  up: number[];
  projection: "perspective" | "ortho";
  /** xeokit exposes these as Float64Array (column-major, same as WebGL) */
  viewMatrix: Float64Array | number[];
  projMatrix: Float64Array | number[];
  on: (event: string, handler: () => void) => void;
  /** `camera.project` is a Projection *object* in xeokit, NOT a function.
   * Use the worldToCanvas() helper below instead of calling project(). */
  project: { matrix: Float64Array | number[] };
}

interface ViewerInstance {
  scene: {
    aabb: number[];
    edges: boolean;
    sao?: { enabled: boolean };
    logarithmicDepthBufferEnabled?: boolean;
    sectionPlanes: Record<string, unknown>;
    objects: Record<string, { selected: boolean; aabb: number[] }>;
    input: {
      on: (event: string, handler: (coords: [number, number]) => void) => void;
    };
    pick: (opts: {
      canvasPos: [number, number];
      pickSurface?: boolean;
    }) => PickResult | null;
  };
  camera: CameraLike;
  cameraFlight: {
    flyTo: (opts: { aabb: number[]; duration: number }) => void;
  };
  cameraControl: {
    active: boolean;
    navMode: "orbit" | "firstPerson" | "planView";
  };
  metaScene?: {
    metaModels?: Record<string, MetaModelLike>;
    metaObjects?: Record<string, MetaObjectLike>;
    getMetaObject?: (id: string) => MetaObjectLike | null;
  };
  destroy: () => void;
}

type LoadableModel = {
  numEntities?: number;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
};

interface Props {
  modelId: string;
  children: ReactNode;
}

// ─── Tree & property helpers ──────────────────────────────────────────────────

function buildNodeTree(meta: MetaObjectLike, depth = 0): IFCNode {
  return {
    id: meta.id,
    name: meta.name || meta.id,
    type: meta.type || "IfcProduct",
    objectId: meta.id,
    children:
      depth < 6
        ? (meta.children ?? []).map((c) => buildNodeTree(c, depth + 1))
        : [],
  };
}

function extractProperties(meta: MetaObjectLike): PropertyRow[] {
  const rows: PropertyRow[] = [];
  for (const pset of meta.propertySets ?? []) {
    const groupName = pset.name ?? "Properties";
    for (const prop of pset.properties ?? []) {
      const raw = prop.value;
      rows.push({
        label: prop.name,
        value:
          raw !== null && raw !== undefined && raw !== "" ? String(raw) : "—",
        group: groupName,
      });
    }
  }
  return rows;
}



const mapAnnotationToIssue = (a: Annotation): AnnotationIssue => {
  const x = a.position?.x ?? 0;
  const y = a.position?.y ?? 0;
  const z = a.position?.z ?? 0;
  const nx = a.position?.normal_x ?? 0;
  const ny = a.position?.normal_y ?? 0;
  const nz = a.position?.normal_z ?? 1;
  return {
    id: a.id,
    modelId: a.model_id,
    positionXyz: [x, y, z],
    normalXyz: [nx, ny, nz],
    message: a.body ? `${a.title}: ${a.body}` : a.title,
    status: a.status,
    createdAt: a.created_at,
  };
};

/**
 * Project a 3-D world-space position to 2-D canvas pixel coordinates.
 *
 * xeokit's Camera exposes `viewMatrix` and `projMatrix` (both Float64Array,
 * column-major / WebGL convention). There is NO `camera.project()` method –
 * `camera.project` is a Projection *object*, not a function.
 *
 * Returns null when the point is behind the camera (w ≤ 0).
 */
function worldToCanvas(
  viewer: ViewerInstance,
  worldPos: [number, number, number],
): [number, number] | null {
  const canvas = (viewer as any).scene?.canvas?.canvas as
    | HTMLCanvasElement
    | undefined;
  const w = canvas?.clientWidth ?? 800;
  const h = canvas?.clientHeight ?? 600;

  const vm = Array.from(viewer.camera.viewMatrix as ArrayLike<number>);
  const pm = Array.from(viewer.camera.projMatrix as ArrayLike<number>);

  if (!vm || !pm || vm.length < 16 || pm.length < 16) return null;

  const [wx, wy, wz] = worldPos;

  // Step 1: view transform  (column-major: result[i] = row-dot)
  const vx = (vm[0] ?? 0) * wx + (vm[4] ?? 0) * wy + (vm[8] ?? 0)  * wz + (vm[12] ?? 0);
  const vy = (vm[1] ?? 0) * wx + (vm[5] ?? 0) * wy + (vm[9] ?? 0)  * wz + (vm[13] ?? 0);
  const vz = (vm[2] ?? 0) * wx + (vm[6] ?? 0) * wy + (vm[10] ?? 0) * wz + (vm[14] ?? 0);
  const vw = (vm[3] ?? 0) * wx + (vm[7] ?? 0) * wy + (vm[11] ?? 0) * wz + (vm[15] ?? 0);

  // Step 2: projection transform
  const cx = (pm[0] ?? 0) * vx + (pm[4] ?? 0) * vy + (pm[8] ?? 0)  * vz + (pm[12] ?? 0) * vw;
  const cy = (pm[1] ?? 0) * vx + (pm[5] ?? 0) * vy + (pm[9] ?? 0)  * vz + (pm[13] ?? 0) * vw;
  const cw = (pm[3] ?? 0) * vx + (pm[7] ?? 0) * vy + (pm[11] ?? 0) * vz + (pm[15] ?? 0) * vw;

  if (Math.abs(cw) < 1e-6) return null; // behind camera

  // Step 3: NDC → screen pixels
  const ndcX = cx / cw;
  const ndcY = cy / cw;

  const sx = Math.round((ndcX + 1) * 0.5 * w);
  const sy = Math.round((1 - ndcY) * 0.5 * h);

  return [sx, sy];
}

export function ViewerProvider({ modelId, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRealModel, setIsRealModel] = useState(false);
  const queryClient = useQueryClient();

  const viewerRef = useRef<ViewerInstance | null>(null);
  const initialViewRef = useRef<{
    eye: number[];
    look: number[];
    up: number[];
  } | null>(null);
  const distanceMeasurementsControlRef = useRef<unknown | null>(null);
  const annotationsPluginRef = useRef<unknown | null>(null);
  const sectionPlanesPluginRef = useRef<unknown | null>(null);

  const {
    activeTool,
    setLoadingProgress,
    setElementCount,
    setFps,
    setAnnotations,
    setSelectedProperties,
    setModelTree,
    setSelectedObjectId,
    selectedObjectId,
    annotations: zustandAnnotations,
  } = useViewerStore();

  const [peerCursors, setPeerCursors] = useState<
    Record<
      string,
      {
        position: [number, number, number];
        name: string;
        avatarColor: string;
        screenPos?: [number, number];
      }
    >
  >({});

  // Recalculate screen projections for peer cursors when camera moves
  const updateCursorProjections = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    setPeerCursors((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id in next) {
        const peer = next[id];
        if (!peer) continue;

        // Use the correct xeokit projection helper (camera.project is NOT a fn)
        const screenPos = worldToCanvas(viewer, peer.position);
        if (!screenPos) continue;

        if (
          !peer.screenPos ||
          peer.screenPos[0] !== screenPos[0] ||
          peer.screenPos[1] !== screenPos[1]
        ) {
          next[id] = { ...peer, screenPos };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  // Stable ref for updateCursorProjections – safe to use inside effects
  const updateCursorProjectionsRef = useRef(updateCursorProjections);
  useEffect(() => {
    updateCursorProjectionsRef.current = updateCursorProjections;
  }, [updateCursorProjections]);

  // 1. Fetch Annotations via TanStack Query
  //    Only call the backend for UUID model IDs; local models ("local-xxx")
  //    would cause a VALIDATION_ERROR since the backend expects a UUID path param.
  const isBackendModel = isBackendModelId(modelId);
  const { data: serverAnnotations } = useQuery({
    queryKey: ["model-annotations", modelId],
    queryFn: () => getAnnotations(modelId),
    enabled: Boolean(modelId) && isBackendModel,
  });

  const activeAnnotations = useMemo(() => {
    return isBackendModel
      ? (serverAnnotations?.map(mapAnnotationToIssue) || [])
      : zustandAnnotations;
  }, [isBackendModel, serverAnnotations, zustandAnnotations]);

  // 2. Annotation mutations (only meaningful for backend models)
  const createMutation = useMutation({
    mutationFn: (payload: CreateAnnotationPayload) => {
      if (!isBackendModel) {
        return Promise.reject(new Error("Annotations are not persisted for local models"));
      }
      return createAnnotation(modelId, payload);
    },
    onSuccess: (newAnno) => {
      queryClient.invalidateQueries({
        queryKey: ["model-annotations", modelId],
      });
      sendMessage("ANNOTATION_CREATED", { annotation: newAnno });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!isBackendModel) {
        return Promise.reject(new Error("Annotations are not persisted for local models"));
      }
      return deleteAnnotation(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ["model-annotations", modelId],
      });
      sendMessage("ANNOTATION_UPDATED", {
        annotation_id: id,
        status: "deleted",
      });
    },
  });

  // ⚠️ CRITICAL: deleteMutation is recreated every render by TanStack Query.
  // Capture it in a ref so the viewer useEffect closure can call it without
  // listing deleteMutation as a dependency (which would cause infinite loops).
  const deleteMutationRef = useRef(deleteMutation);
  useEffect(() => {
    deleteMutationRef.current = deleteMutation;
  }, [deleteMutation]);

  // 3. Setup WebSocket connection
  const onMessageReceived = useCallback(
    (event: WSEvent, data: any) => {
      switch (event) {
        case "USER_JOINED":
          setPeerCursors((prev) => ({
            ...prev,
            [data.user.id]: {
              position: [0, 0, 0],
              name: data.user.name,
              avatarColor: data.user.avatarColor || "#7c3aed",
            },
          }));
          break;
        case "USER_LEFT":
          setPeerCursors((prev) => {
            const next = { ...prev };
            delete next[data.user_id];
            return next;
          });
          break;
        case "CURSOR_MOVED":
          setPeerCursors((prev) => {
            if (!prev[data.user_id]) return prev;
            const updated = {
              ...prev[data.user_id],
              position: data.position as [number, number, number],
            } as (typeof prev)[string];

            const viewer = viewerRef.current;
            if (viewer) {
              // worldToCanvas uses viewMatrix/projMatrix — camera.project is NOT a fn
              const sp = worldToCanvas(
                viewer,
                data.position as [number, number, number],
              );
              if (sp) updated.screenPos = sp;
            }
            return {
              ...prev,
              [data.user_id]: updated,
            };
          });
          break;
        case "ANNOTATION_CREATED":
        case "ANNOTATION_UPDATED":
          queryClient.invalidateQueries({
            queryKey: ["model-annotations", modelId],
          });
          break;
        case "MODEL_PROCESSING":
          if (data && typeof data === "object" && data !== null && "progress_pct" in data) {
            setLoadingProgress(data.progress_pct as number);
          }
          break;
        case "MODEL_READY":
          setLoadingProgress(100);
          break;
        case "MODEL_FAILED":
          console.error("Model conversion failed:", data);
          break;
        default:
          break;
      }
    },
    [modelId, queryClient],
  );

  const { sendMessage } = useWebSocket(modelId, onMessageReceived);

  // Throttled cursor position sender
  const lastCursorSentRef = useRef(0);
  const sendCursorMoveThrottled = useCallback(
    (pos: number[], norm: number[]) => {
      const now = Date.now();
      if (now - lastCursorSentRef.current > 100) {
        sendMessage("CURSOR_MOVE", {
          model_id: modelId,
          position: pos,
          normal: norm,
        });
        lastCursorSentRef.current = now;
      }
    },
    [modelId, sendMessage],
  );

  const sendCursorMoveRef = useRef(sendCursorMoveThrottled);
  useEffect(() => {
    sendCursorMoveRef.current = sendCursorMoveThrottled;
  }, [sendCursorMoveThrottled]);

  // Synchronize annotations to xeokit AnnotationsPlugin when fetched or updated
  useEffect(() => {
    const plugin = annotationsPluginRef.current as any;
    if (!plugin || !isRealModel || !activeAnnotations) return;

    // Clear existing
    for (const key in plugin.annotations) {
      plugin.destroyAnnotation(key);
    }

    // Load new pins
    activeAnnotations.forEach((anno) => {
      plugin.createAnnotation({
        id: anno.id,
        worldPos: anno.positionXyz,
        occludable: false, // Prevent depth-buffer conflicts from falsely hiding markers
        markerShown: true,
        labelShown: true,
        values: {
          id: anno.id,
          glyph: "A",
          title: "Observation",
          description: anno.message ?? "",
        },
      });
    });

    if (isBackendModel && serverAnnotations) {
      useViewerStore.getState().setAnnotations(serverAnnotations.map(mapAnnotationToIssue));
    }

    // Wait for xeokit to flush DOM updates then calculate initial collision layout
    setTimeout(() => {
      updateLabelLayout();
    }, 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAnnotations, isRealModel, isBackendModel, serverAnnotations]);

  // Subscribe to activeTool state changes and adjust viewer controls
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const distanceCtrl = distanceMeasurementsControlRef.current as any;
    if (distanceCtrl) {
      distanceCtrl.deactivate();
    }
    const sectionPlanes = sectionPlanesPluginRef.current as any;
    if (sectionPlanes) {
      sectionPlanes.hideControl();
    }

    if (activeTool === "orbit") {
      viewer.cameraControl.active = true;
      viewer.cameraControl.navMode = "orbit";
    } else if (activeTool === "pan") {
      viewer.cameraControl.active = true;
      viewer.cameraControl.navMode = "planView";
    } else if (activeTool === "zoom") {
      viewer.cameraControl.active = true;
      viewer.cameraControl.navMode = "orbit";
    } else if (activeTool === "select") {
      viewer.cameraControl.active = true;
      viewer.cameraControl.navMode = "orbit";
    } else if (activeTool === "measure") {
      viewer.cameraControl.active = true;
      viewer.cameraControl.navMode = "orbit";
      if (distanceCtrl) {
        distanceCtrl.activate();
      }
    } else if (activeTool === "annotation" || activeTool === "section") {
      viewer.cameraControl.active = true;
      viewer.cameraControl.navMode = "orbit";
    }
  }, [activeTool]);

  // Highlight selected metadata object
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const objects = viewer.scene.objects;
    for (const id in objects) {
      const obj = objects[id];
      if (obj && obj.selected) {
        obj.selected = false;
      }
    }

    const currentObj = selectedObjectId ? objects[selectedObjectId] : null;
    if (selectedObjectId && currentObj) {
      currentObj.selected = true;
      viewer.cameraFlight.flyTo({
        aabb: currentObj.aabb,
        duration: 0.5,
      });
    }
  }, [selectedObjectId]);

  // Initialize the xeokit-sdk viewer and model file loading
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    let mockInterval: ReturnType<typeof setInterval> | null = null;
    let fpsInterval: ReturnType<typeof setInterval> | null = null;
    let handleAnnoDeleteClick: ((e: MouseEvent) => void) | null = null;
    let annoDeleteContainer: HTMLElement | null = null;

    async function initViewer() {
      try {
        const file = await localModelStore.getFile(modelId);
        if (!active) return;

        if (file) {
          setIsRealModel(true);

          setLoadingProgress(10);
          setElementCount(0);
          setSelectedProperties(null);
          setModelTree([]);
          setAnnotations([]);

          if (!canvasRef.current) {
            await new Promise((r) => setTimeout(r, 150));
            if (!active) return;
          }

          if (!canvasRef.current) {
            console.error("[Viewer] Canvas element not found");
            return;
          }

          performance.mark("viewer-load-start");

          const xeokit = await import("@xeokit/xeokit-sdk");
          const {
            Viewer,
            XKTLoaderPlugin,
            AnnotationsPlugin,
            DistanceMeasurementsPlugin,
            DistanceMeasurementsMouseControl,
            SectionPlanesPlugin,
          } = xeokit;
          // These plugins exist at runtime but may not be in the TS declarations
          const GLTFLoaderPlugin = (xeokit as any).GLTFLoaderPlugin;
          const WebIFCLoaderPlugin = (xeokit as any).WebIFCLoaderPlugin;

          if (!active) return;

          const viewer = new Viewer({
            canvasElement: canvasRef.current as HTMLCanvasElement,
            transparent: true,
          } as any) as unknown as ViewerInstance;

          viewerRef.current = viewer;

          // Track camera updates to recalculate peer cursors projections and label layouts
          viewer.camera.on("matrix", () => {
            updateCursorProjectionsRef.current();
            updateLabelLayout();
          });

          // Send cursor movements on mousemove
          viewer.scene.input.on("mousemove", (coords: [number, number]) => {
            if (!active) return;
            const hit = viewer.scene.pick({
              canvasPos: coords,
              pickSurface: true,
            });
            if (hit && hit.worldPos) {
              sendCursorMoveRef.current(
                hit.worldPos,
                hit.worldNormal || [0, 0, 1],
              );
            }
          });

          // Initialize plugins
          const annotationsPlugin = new (AnnotationsPlugin as any)(viewer, {
            container: canvasRef.current?.parentElement ?? document.body,
            markerHTML: "<div class='xeokit-annotation-marker'>{{glyph}}</div>",
            labelHTML:
              "<div class='xeokit-annotation-label-wrapper'>" +
              "<svg class='xeokit-annotation-svg'><line x1='0' y1='0' x2='0' y2='0' /></svg>" +
              "<div class='xeokit-annotation-label'>" +
              "<div class='flex justify-between items-start gap-2'>" +
              "<div class='xeokit-annotation-title'>{{title}}</div>" +
              "<button class='xeokit-annotation-delete text-red-400 hover:text-red-500 font-bold ml-2' data-anno-id='{{id}}'>✕</button>" +
              "</div>" +
              "<div class='xeokit-annotation-desc'>{{description}}</div>" +
              "</div>" +
              "</div>",
            values: {
              id: "",
              glyph: "1",
              title: "Observation",
              description: "Annotation point",
            },
          } as any) as any;
          annotationsPluginRef.current = annotationsPlugin;

          annotationsPlugin.on("markerClicked", (anno: any) => {
            // Dispatch ANNOTATION_SELECTED action to Zustand on pin click
            useViewerStore.getState().setSelectedAnnotationId(anno.id);
            anno.labelShown = !anno.labelShown;
          });

          // Event delegation to delete annotations
          annoDeleteContainer = canvasRef.current?.parentElement ?? null;
          handleAnnoDeleteClick = async (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const btn = target.closest(".xeokit-annotation-delete");
            if (btn) {
              const annoId = btn.getAttribute("data-anno-id");
              if (annoId) {
                try {
                  if (!isBackendModel) {
                    // Local model deletion
                    const store = useViewerStore.getState();
                    const filtered = store.annotations.filter((a) => a.id !== annoId);
                    store.setAnnotations(filtered);
                  } else {
                    // Use ref to avoid capturing stale mutation or causing dep loop
                    await deleteMutationRef.current.mutateAsync(annoId);
                  }
                  if (annotationsPlugin.annotations[annoId]) {
                    annotationsPlugin.destroyAnnotation(annoId);
                  }
                } catch (err) {
                  console.error("Failed to delete annotation:", err);
                }
              }
            }
          };
          annoDeleteContainer?.addEventListener("click", handleAnnoDeleteClick);

          const distanceMeasurements = new (DistanceMeasurementsPlugin as any)(
            viewer,
            { container: canvasRef.current?.parentElement ?? document.body },
          ) as any;
          const distanceMeasurementsControl =
            new DistanceMeasurementsMouseControl(distanceMeasurements as any) as any;
          distanceMeasurementsControl.snapToVertex = true;
          distanceMeasurementsControl.snapToEdge = true;
          distanceMeasurementsControlRef.current = distanceMeasurementsControl;

          distanceMeasurements.on("mouseOver", (e: any) => {
            e.measurement.setHighlighted(true);
          });
          distanceMeasurements.on("mouseLeave", (e: any) => {
            e.measurement.setHighlighted(false);
          });

          distanceMeasurements.on("contextMenu", (e: any) => {
            e.event.preventDefault();
            distanceMeasurements.destroyMeasurement(e.measurement.id);
          });

          const sectionPlanesPlugin = new SectionPlanesPlugin(viewer as unknown as never) as any;
          sectionPlanesPluginRef.current = sectionPlanesPlugin;

          viewer.scene.input.on("doubleclicked", () => {
            if (useViewerStore.getState().activeTool === "section") {
              sectionPlanesPlugin.clear();
              sessionStorage.removeItem(`section-planes-${modelId}`);
            }
          });

          // Restore persisted section planes from sessionStorage
          const savedPlanes = sessionStorage.getItem(`section-planes-${modelId}`);
          if (savedPlanes) {
            try {
              const planes = JSON.parse(savedPlanes) as Array<{ id: string; pos: number[]; dir: number[] }>;
              planes.forEach((p) => {
                sectionPlanesPlugin.createSectionPlane({
                  id: p.id,
                  pos: p.pos,
                  dir: p.dir,
                });
              });
            } catch { /* ignore corrupt data */ }
          }

          objectUrl = URL.createObjectURL(file);
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
          const ds = new LocalFetchDataSource();
          let model: LoadableModel;

          setLoadingProgress(20);

          if (ext === "glb" || ext === "gltf") {
            const loader = new GLTFLoaderPlugin(viewer as unknown as never, {
              dataSource: ds,
            } as never);
            model = loader.load({
              id: modelId,
              src: objectUrl,
            }) as unknown as LoadableModel;
          } else if (ext === "ifc") {
            const WebIFC = await import("web-ifc");
            if (!active) return;

            const ifcAPI = new WebIFC.IfcAPI();
            ifcAPI.SetWasmPath("/wasm/");
            await ifcAPI.Init();
            if (!active) return;

            const ifcBytes = await file.arrayBuffer();
            if (!active) return;

            setLoadingProgress(30);

            // @ts-ignore – xeokit types can lag behind SDK
            const loader = new WebIFCLoaderPlugin(viewer as unknown as never, {
              WebIFC,
              IfcAPI: ifcAPI,
            });

            model = loader.load({
              id: modelId,
              ifc: ifcBytes,
              edges: true,
              excludeUnclassifiedObjects: false,
            } as unknown as never) as unknown as LoadableModel;
          } else {
            const loader = new (XKTLoaderPlugin as any)(viewer, {
              dataSource: ds,
            });
            model = loader.load({
              id: modelId,
              src: objectUrl,
              edges: true,
            } as unknown as never) as unknown as LoadableModel;
          }

          model.on("loaded", () => {
            performance.mark("viewer-first-geometry");
            performance.measure(
              "viewer-initial-render",
              "viewer-load-start",
              "viewer-first-geometry",
            );

            if (!active) return;
            const count = model.numEntities ?? 0;
            setLoadingProgress(100);
            setElementCount(count);


            // Dynamic SAO and Logarithmic Depth Buffer tuning based on PRD limits
            if (viewer.scene.sao) {
              viewer.scene.sao.enabled = count < 100000;
            }
            if (count > 50000) {
              viewer.scene.logarithmicDepthBufferEnabled = true;
            }

            // Expose initial home camera
            initialViewRef.current = {
              eye: [...viewer.camera.eye],
              look: [...viewer.camera.look],
              up: [...viewer.camera.up],
            };

            // Build node tree from MetaModel
            const metaModels = viewer.metaScene?.metaModels ?? {};
            const metaModel = metaModels[modelId] as MetaModelLike | undefined;

            if (
              metaModel?.rootMetaObjects &&
              metaModel.rootMetaObjects.length > 0
            ) {
              setModelTree(
                metaModel.rootMetaObjects.map((r) => buildNodeTree(r)),
              );
            } else {
              const allMeta = viewer.metaScene?.metaObjects ?? {};
              const roots = Object.values(allMeta)
                .filter((m) => m.type && m.type !== "Default")
                .slice(0, 60);
              setModelTree(
                roots.map((m) => ({
                  id: m.id,
                  name: m.name ?? m.id,
                  type: m.type ?? "IfcProduct",
                  objectId: m.id,
                  children: [],
                })),
              );
            }

            // Route interactions based on current tool mode
            viewer.scene.input.on("mouseclicked", (coords: any) => {
              if (!active) return;
              if (!coords || coords.length !== 2) return;
              const canvasPos = coords as [number, number];

              const currentTool = useViewerStore.getState().activeTool;

              const hit = viewer.scene.pick({
                canvasPos,
                pickSurface: true,
              });

              if (!hit || !hit.entity) {
                if (currentTool === "select") {
                  setSelectedProperties(null);
                  setSelectedObjectId(null);
                }
                return;
              }

              const entityId = hit.entity?.id;
              if (!entityId) return;

              if (currentTool === "select") {
                setSelectedObjectId(entityId);
                const meta =
                  viewer.metaScene?.metaModels?.[modelId]?.metaObjects?.[
                    entityId
                  ] ??
                  viewer.metaScene?.metaObjects?.[entityId] ??
                  null;

                if (meta) {
                  setSelectedProperties({
                    elementName: meta.name || entityId,
                    ifcType: meta.type || "IfcProduct",
                    globalModelId: entityId,
                    attributes: extractProperties(meta),
                  });
                } else {
                  setSelectedProperties({
                    elementName: entityId,
                    ifcType: "IfcProduct",
                    globalModelId: entityId,
                    attributes: [],
                  });
                }
              } else if (currentTool === "annotation") {
                if (hit.worldPos && entityId) {
                  const normal = hit.worldNormal || [0, 0, 1];
                  useViewerStore.getState().setAnnotationModal({
                    isOpen: true,
                    worldPos: Array.from(hit.worldPos) as [number, number, number],
                    entityId: entityId,
                    mockScreenPos: null,
                    worldNormal: Array.from(normal) as [number, number, number],
                  });
                }
              } else if (currentTool === "section") {
                if (hit.worldPos) {
                  const currentPlanes = Object.keys(sectionPlanesPlugin.sectionPlanes || {});
                  if (currentPlanes.length >= 6) {
                    window.dispatchEvent(
                      new CustomEvent("show-annotation-toast", { detail: "Maximum of 6 section planes allowed." })
                    );
                    return;
                  }

                  const sectionId = "plane-" + Date.now();
                  const normal = hit.worldNormal;
                  let dir: [number, number, number] = [0.0, -1.0, 0.0];
                  if (normal && normal.length >= 3) {
                    const n0 = normal[0];
                    const n1 = normal[1];
                    const n2 = normal[2];
                    if (n0 !== undefined && n1 !== undefined && n2 !== undefined) {
                      dir = [-n0, -n1, -n2];
                    }
                  }

                  sectionPlanesPlugin.createSectionPlane({
                    id: sectionId,
                    pos: hit.worldPos,
                    dir: dir,
                  });
                  sectionPlanesPlugin.showControl(sectionId);

                  // Persist to session storage
                  const planesToSave = Object.values(
                    (sectionPlanesPlugin.sectionPlanes || {}) as Record<string, { id: string; pos: number[]; dir: number[] }>,
                  ).map((p) => ({
                    id: p.id,
                    pos: p.pos,
                    dir: p.dir,
                  }));
                  sessionStorage.setItem(`section-planes-${modelId}`, JSON.stringify(planesToSave));
                }
              }
            });
          });

          model.on("error", (...args: unknown[]) => {
            console.error("[Viewer] Model load error:", args);
            setLoadingProgress(100);
          });
        } else {
          // Mock mode: local testing simulations
          setIsRealModel(false);
          setLoadingProgress(10);
          setElementCount(0);
          setModelTree([]);

          let progress = 10;
          mockInterval = setInterval(() => {
            progress += 15;
            setLoadingProgress(Math.min(progress, 100));
            if (progress >= 100) {
              if (mockInterval) clearInterval(mockInterval);
              setElementCount(350);
              // Setup a static mock model tree
              setModelTree([
                {
                  id: "building",
                  name: "Mock Corporate Office",
                  type: "IfcBuilding",
                  children: [
                    {
                      id: "level1",
                      name: "Level 1 Floor Plan",
                      type: "IfcBuildingStorey",
                      children: [
                        {
                          id: "mock-slab-L1",
                          name: "Main Floor Slab",
                          type: "IfcSlab",
                        },
                        { id: "wall-1", name: "Exterior Wall West", type: "IfcWall" },
                        { id: "door-1", name: "Entrance Glass Door", type: "IfcDoor" },
                      ],
                    },
                  ],
                },
              ]);
            }
          }, 150);
        }
      } catch (err) {
        console.error("[Viewer] Initialization failed:", err);
        setLoadingProgress(100);
      }
    }

    initViewer();

    // Poll xeokit's built-in FPS counter (PRD §4.5)
    fpsInterval = setInterval(() => {
      const viewer = viewerRef.current;
      if (viewer) {
        const currentFps = Math.round((viewer.scene as unknown as { fps?: number }).fps ?? 60);
        setFps(currentFps);
      }
    }, 1000);

    return () => {
      active = false;
      if (mockInterval) clearInterval(mockInterval);
      if (fpsInterval) clearInterval(fpsInterval);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      if (annoDeleteContainer && handleAnnoDeleteClick) {
        annoDeleteContainer.removeEventListener("click", handleAnnoDeleteClick);
      }
      // Access Zustand store directly (always stable, not a render dependency)
      const store = useViewerStore.getState();
      store.setLoadingProgress(0);
      store.setElementCount(0);
      store.setModelTree([]);
      store.setAnnotations([]);
    };
  // ⚠️ ONLY modelId here. All other references are accessed via stable refs
  // or useViewerStore.getState(). Adding anything else causes infinite loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  const goHome = () => {
    const v = viewerRef.current;
    const home = initialViewRef.current;
    if (v && home) {
      v.cameraFlight.flyTo({
        aabb: v.scene.aabb,
        duration: 0.8,
      });
      v.camera.eye = [...home.eye];
      v.camera.look = [...home.look];
      v.camera.up = [...home.up];
    }
  };

  const fitToView = () => {
    const v = viewerRef.current;
    if (v) {
      v.cameraFlight.flyTo({
        aabb: v.scene.aabb,
        duration: 0.6,
      });
    }
  };

  const toggleSettings = () => {
    const v = viewerRef.current;
    if (v) {
      const current = v.camera.projection;
      const next = current === "perspective" ? "ortho" : "perspective";
      v.camera.projection = next;
    }
  };

  const shareView = () => {
    window.dispatchEvent(new CustomEvent("open-share-modal"));
  };

  const addRealModelAnnotation = async (
    worldPos: [number, number, number],
    _entityId: string,
    message: string,
    worldNormal?: [number, number, number],
  ) => {
    const annotationsPlugin = annotationsPluginRef.current as any;
    const viewer = viewerRef.current;
    if (!annotationsPlugin || !viewer) return;

    const normal = worldNormal || [0, 0, 1];

    if (!isBackendModel) {
      // Local model: save directly to Zustand store
      const localId = "local-anno-" + Date.now();
      const newAnno: AnnotationIssue = {
        id: localId,
        modelId: modelId,
        positionXyz: worldPos,
        normalXyz: normal,
        message: `Observation: ${message}`,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      useViewerStore.getState().addAnnotation(newAnno);
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: "Annotation",
        body: message,
        position: {
          x: worldPos[0] ?? 0,
          y: worldPos[1] ?? 0,
          z: worldPos[2] ?? 0,
          normal_x: normal[0] ?? 0,
          normal_y: normal[1] ?? 0,
          normal_z: normal[2] ?? 1,
        },
      });
    } catch (err) {
      console.error("Failed to save annotation:", err);
    }
  };

  return (
    <ViewerContext.Provider
      value={{
        canvasRef,
        modelId,
        isRealModel,
        goHome,
        fitToView,
        toggleSettings,
        shareView,
        addRealModelAnnotation,
        peerCursors,
        sendMessage,
      }}
    >
      {children}
    </ViewerContext.Provider>
  );
}
