import { create } from "zustand";

export type ActiveNav =
  | "dashboard"
  | "projects"
  | "models"
  | "viewer"
  | "annotations";

type LayoutStore = {
  activeNav: ActiveNav;
  setActiveNav: (nav: ActiveNav) => void;
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  activeNav: "dashboard",
  setActiveNav: (nav) => set({ activeNav: nav }),
}));
