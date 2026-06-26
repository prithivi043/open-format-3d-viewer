import { create } from "zustand";

type ViewerState = {
  selectedObjectId: string | null;
  selectedAnnotationId: string | null;
  setSelectedObjectId: (id: string | null) => void;
  setSelectedAnnotationId: (id: string | null) => void;
};

export const useViewerStore = create<ViewerState>((set) => ({
  selectedObjectId: null,
  selectedAnnotationId: null,
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
}));
