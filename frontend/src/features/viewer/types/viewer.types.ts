export type ToolMode =
  | "orbit"
  | "pan"
  | "zoom"
  | "select"
  | "measure"
  | "section"
  | "annotation";

/** Slim member representation used in the viewer status bar */
export interface ViewerMember {
  id: string;
  fullName: string;
  avatarColor: string;
}

export interface IFCNode {
  id: string;
  name: string;
  type: string;
  children?: IFCNode[];
  objectId?: string;
}

/** A single key-value property row (real or derived) */
export interface PropertyRow {
  label: string;
  value: string;
  group?: string;
}

export interface ElementProperties {
  elementName: string;
  ifcType: string;
  globalModelId: string;
  /** Dynamic properties extracted from xeokit metaObject */
  attributes: PropertyRow[];
}

export interface AnnotationIssue {
  id: string;
  modelId: string;
  positionXyz: [number, number, number];
  normalXyz: [number, number, number];
  message: string;
  status: "open" | "closed" | "in_review" | "resolved";
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
  /** Real model tree built from xeokit MetaModel after load */
  modelTree: IFCNode[];
  /** Real project members loaded from the API after model loads */
  projectMembers: ViewerMember[];
  annotationModal: {
    isOpen: boolean;
    worldPos: [number, number, number] | null;
    entityId: string | null;
    mockScreenPos: [number, number] | null;
    worldNormal?: [number, number, number] | null;
  };


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
  setModelTree: (tree: IFCNode[]) => void;
  setProjectMembers: (members: ViewerMember[]) => void;
  setAnnotationModal: (modal: {
    isOpen: boolean;
    worldPos: [number, number, number] | null;
    entityId: string | null;
    mockScreenPos: [number, number] | null;
    worldNormal?: [number, number, number] | null;
  }) => void;
}
