import { create } from "zustand";

type UploadState = {
  progress: number;
  isUploading: boolean;
  setProgress: (value: number) => void;
  setUploading: (value: boolean) => void;
  reset: () => void;
};

export const useUploadStore = create<UploadState>((set) => ({
  progress: 0,
  isUploading: false,

  setProgress: (value) => set({ progress: value }),
  setUploading: (value) => set({ isUploading: value }),

  reset: () =>
    set({
      progress: 0,
      isUploading: false,
    }),
}));
