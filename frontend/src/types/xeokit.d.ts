// Type definitions for xeokit-sdk
declare module "@xeokit/xeokit-sdk" {
  export class Viewer {
    constructor(cfg: { canvasId: string; transparent: boolean });
    scene: Scene;
    camera: Camera;
    destroy(): void;
  }
  
  export class Scene {
    canvas: { canvas: HTMLCanvasElement };
    input: Input;
  }

  export class Input {
    on(event: string, callback: (coords: number[]) => void): void;
  }

  export class Camera {
    eye: number[];
    look: number[];
    up: number[];
    on(event: string, callback: () => void): void;
  }

  export class XKTLoaderPlugin {
    constructor(viewer: Viewer);
    load(params: { id: string; src: string; edges: boolean }): void;
  }

  export class AnnotationsPlugin {
    constructor(viewer: Viewer, cfg: {
      markerHTML: string;
      labelHTML: string;
      values: Record<string, string>;
      surfaceOffset: number;
    });
    createAnnotation(cfg: {
      id: string;
      worldPos: number[];
      occludable: boolean;
      markerShown: boolean;
      labelShown: boolean;
      values: { title: string; description: string };
    }): AnnotationMarker;
    on(event: string, callback: (annotation: AnnotationMarker) => void): void;
    clear(): void;
    destroy(): void;
  }

  export class AnnotationMarker {
    id: string;
    setLabelShown(shown: boolean): void;
  }

  export class DistanceMeasurementsPlugin {
    constructor(viewer: Viewer);
    on(event: string, callback: (e: MeasurementEvent) => void): void;
    destroy(): void;
  }

  export class DistanceMeasurementsMouseControl {
    constructor(plugin: DistanceMeasurementsPlugin);
    activate(): void;
    deactivate(): void;
  }

  export class SectionPlanesPlugin {
    constructor(viewer: Viewer);
    createSectionPlane(cfg: { pos: number[]; dir: number[] }): void;
    destroy(): void;
  }

  export class TreeViewPlugin {
    constructor(viewer: Viewer, cfg: { containerElement: HTMLElement; autoExpandDepth: number });
    destroy(): void;
  }

  export class FastNavPlugin {
    constructor(viewer: Viewer, cfg: {
      hideEdges: boolean;
      hideSAO: boolean;
      hideColorTexture: boolean;
      hidePBR: boolean;
      hideTransparentObjects: boolean;
      scaleCanvasResolution: boolean;
      scaleCanvasResolutionFactor: number;
      delayBeforeRestore: number;
    });
  }

  export interface MeasurementEvent {
    id: string;
  }
}
