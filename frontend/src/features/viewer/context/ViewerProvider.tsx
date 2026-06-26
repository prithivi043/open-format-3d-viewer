import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useViewerStore } from "../store/viewerStore";
import { Viewer, XKTLoaderPlugin, GLTFLoaderPlugin } from "@xeokit/xeokit-sdk";
import { localModelStore } from "../../../lib/localModelStore";

interface ViewerContextValue {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  modelId: string;
  isRealModel: boolean;
}

const ViewerContext = createContext<ViewerContextValue | null>(null);

export function useViewerContext() {
  const ctx = useContext(ViewerContext);
  if (!ctx) throw new Error("useViewerContext must be used inside ViewerProvider");
  return ctx;
}

interface Props {
  modelId: string;
  children: ReactNode;
}

export function ViewerProvider({ modelId, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRealModel, setIsRealModel] = useState(false);
  const {
    setLoadingProgress,
    setElementCount,
    setFps,
    setAnnotations,
    setSelectedProperties,
  } = useViewerStore();

  useEffect(() => {
    let active = true;
    let viewerInstance: Viewer | null = null;
    let objectUrl: string | null = null;
    let mockInterval: any;
    let fpsInterval: any;

    async function initViewer() {
      try {
        const file = await localModelStore.getFile(modelId);
        if (!active) return;

        if (file) {
          setIsRealModel(true);
          setLoadingProgress(0);
          setElementCount(0);

          // Wait a brief moment for the canvas to render in the DOM
          if (!canvasRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            if (!active) return;
          }

          if (!canvasRef.current) {
            console.error("Canvas element not found");
            return;
          }

          const viewer = new Viewer({
            canvasElement: canvasRef.current,
            transparent: true,
          });
          viewerInstance = viewer;

          const fileNameLower = file.name.toLowerCase();
          objectUrl = URL.createObjectURL(file);

          let model: any;
          if (fileNameLower.endsWith(".glb") || fileNameLower.endsWith(".gltf")) {
            const gltfLoader = new GLTFLoaderPlugin(viewer);
            model = gltfLoader.load({
              id: modelId,
              src: objectUrl,
            });
          } else {
            const xktLoader = new XKTLoaderPlugin(viewer);
            model = xktLoader.load({
              id: modelId,
              src: objectUrl,
            });
          }

          model.on("loaded", () => {
            if (!active) return;
            setLoadingProgress(100);

            // Populate metadata from model properties
            const count = model.numEntities || 850;
            setElementCount(count);

            setSelectedProperties({
              elementName: file.name,
              ifcType: fileNameLower.endsWith(".ifc") ? "IfcProject" : "ModelObject",
              globalModelId: modelId,
              material: "Composite",
              height: "N/A",
              length: "N/A",
              width: "N/A",
              volume: "N/A",
              fireRating: "N/A",
            });

            // Set simple default annotations
            setAnnotations([
              {
                id: "ann-1",
                modelId,
                positionXyz: [0, 0, 0],
                normalXyz: [0, 1, 0],
                message: `Loaded ${file.name} successfully.`,
                status: "open",
                createdAt: new Date().toISOString(),
              },
            ]);
          });

          model.on("error", (msg: string) => {
            console.error("xeokit model load error:", msg);
            if (!active) return;
            setLoadingProgress(100);
          });

          // FPS simulation
          fpsInterval = setInterval(() => {
            if (!active) return;
            setFps(Math.floor(58 + Math.random() * 5));
          }, 2000) as any;

        } else {
          // Fallback mock loading sequence
          setIsRealModel(false);
          setLoadingProgress(0);
          setElementCount(0);

          let progress = 0;
          mockInterval = setInterval(() => {
            if (!active) return;
            progress += Math.random() * 15;
            if (progress >= 100) {
              progress = 100;
              if (mockInterval) clearInterval(mockInterval);
              setElementCount(12500);
              setSelectedProperties({
                elementName: "Basic Wall-Interior",
                ifcType: "IfcWall",
                globalModelId: "1a2b3c4d5e6f7g8h90",
                material: "Concrete",
                height: "3.200m",
                length: "6.500m",
                width: "0.200m",
                volume: "4.16m",
                fireRating: "2 Hours",
              });
              setAnnotations([
                {
                  id: "ann-1",
                  modelId,
                  positionXyz: [10, 2, 5],
                  normalXyz: [0, 1, 0],
                  message: "Check structural integrity of north wall junction",
                  status: "open",
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                },
                {
                  id: "ann-2",
                  modelId,
                  positionXyz: [5, 3, 8],
                  normalXyz: [1, 0, 0],
                  message: "Window frame alignment off by 2mm",
                  status: "open",
                  createdAt: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                  id: "ann-3",
                  modelId,
                  positionXyz: [15, 0, 3],
                  normalXyz: [0, 0, 1],
                  message: "Column footing reinforcement confirmed",
                  status: "closed",
                  createdAt: new Date(Date.now() - 7200000).toISOString(),
                },
              ]);
            }
            setLoadingProgress(Math.min(progress, 100));
          }, 80) as any;

          // FPS simulation
          fpsInterval = setInterval(() => {
            if (!active) return;
            setFps(Math.floor(55 + Math.random() * 10));
          }, 2000) as any;
        }
      } catch (error) {
        console.error("Failed to initialize local model viewer:", error);
        if (!active) return;
        setLoadingProgress(100);
      }
    }

    initViewer();

    return () => {
      active = false;
      if (mockInterval) clearInterval(mockInterval);
      if (fpsInterval) clearInterval(fpsInterval);
      if (viewerInstance) {
        try {
          viewerInstance.destroy();
        } catch (e) {
          console.error("Error destroying viewer:", e);
        }
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [modelId]);

  return (
    <ViewerContext.Provider value={{ canvasRef, modelId, isRealModel }}>
      {children}
    </ViewerContext.Provider>
  );
}
