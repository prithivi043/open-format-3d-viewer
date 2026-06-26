export type ToolMode =
  | "orbit"
  | "pan"
  | "zoom"
  | "select"
  | "measure"
  | "section"
  | "annotation";

export interface IFCNode {
  id: string;
  name: string;
  type: string;
  children?: IFCNode[];
  objectId?: string;
}

export interface ElementProperties {
  elementName: string;
  ifcType: string;
  globalModelId: string;
  material: string;
  height: string;
  length: string;
  width: string;
  volume: string;
  fireRating: string;
}

export interface AnnotationIssue {
  id: string;
  modelId: string;
  positionXyz: [number, number, number];
  normalXyz: [number, number, number];
  message: string;
  status: "open" | "closed";
  createdAt: string;
}

export interface ViewerState {
  activeTool: ToolMode;
  selectedObjectId: string | null;
  selectedAnnotationId: string | null;
  loadingProgress: number;
  elementCount: number;
  fps: number;
  onlineCount: number;
  selectedProperties: ElementProperties | null;
  annotations: AnnotationIssue[];
  isModelTreeOpen: boolean;
  isPropertiesOpen: boolean;
  activeRightTab: "properties" | "annotations";
  expandedNodes: Set<string>;

  setActiveTool: (tool: ToolMode) => void;
  setSelectedObjectId: (id: string | null) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setLoadingProgress: (p: number) => void;
  setElementCount: (n: number) => void;
  setFps: (fps: number) => void;
  setSelectedProperties: (props: ElementProperties | null) => void;
  setAnnotations: (annotations: AnnotationIssue[]) => void;
  addAnnotation: (annotation: AnnotationIssue) => void;
  toggleModelTree: () => void;
  toggleProperties: () => void;
  setActiveRightTab: (tab: "properties" | "annotations") => void;
  toggleNodeExpanded: (nodeId: string) => void;
}
