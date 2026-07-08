import { create } from "zustand";
import type { ViewerState, ToolMode, ElementProperties, AnnotationIssue, IFCNode, ViewerMember } from "../types/viewer.types";


export const useViewerStore = create<ViewerState>((set) => ({
  activeTool: "orbit",
  selectedObjectId: null,
  selectedAnnotationId: null,
  loadingProgress: 0,
  elementCount: 0,
  fps: 60,
  onlineCount: 4,
  selectedProperties: null,
  annotations: [],
  isModelTreeOpen: true,
  isPropertiesOpen: true,
  activeRightTab: "properties",
  expandedNodes: new Set(["building", "level1"]),
  modelTree: [],
  projectMembers: [],
  annotationModal: {
    isOpen: false,
    worldPos: null,
    entityId: null,
    mockScreenPos: null,
  },



  setActiveTool: (tool: ToolMode) => set({ activeTool: tool }),
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
  setLoadingProgress: (p) => set({ loadingProgress: p }),
  setElementCount: (n) => set({ elementCount: n }),
  setFps: (fps) => set({ fps }),
  setSelectedProperties: (props: ElementProperties | null) => set({ selectedProperties: props }),
  setAnnotations: (annotations: AnnotationIssue[]) => set({ annotations }),
  addAnnotation: (annotation: AnnotationIssue) =>
    set((state) => ({ annotations: [...state.annotations, annotation] })),
  toggleModelTree: () => set((s) => ({ isModelTreeOpen: !s.isModelTreeOpen })),
  toggleProperties: () => set((s) => ({ isPropertiesOpen: !s.isPropertiesOpen })),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  toggleNodeExpanded: (nodeId: string) =>
    set((state) => {
      const next = new Set(state.expandedNodes);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return { expandedNodes: next };
    }),
  setModelTree: (tree: IFCNode[]) => set({ modelTree: tree }),
  setProjectMembers: (members: ViewerMember[]) => set({ projectMembers: members }),
  setAnnotationModal: (modal) => set({ annotationModal: modal }),
}));

