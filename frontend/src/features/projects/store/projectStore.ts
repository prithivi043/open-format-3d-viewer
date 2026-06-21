import { create } from "zustand";
import type {
  Project,
  ProjectMember,
  ProjectRole,
} from "../types/project.types";

type ProjectState = {
  selectedProject: Project | null;
  members: ProjectMember[];
  currentUserRole: ProjectRole | null;

  setSelectedProject: (project: Project) => void;
  clearSelectedProject: () => void;
  setMembers: (members: ProjectMember[]) => void;
  setCurrentUserRole: (role: ProjectRole) => void;
};

export const useProjectStore = create<ProjectState>((set) => ({
  selectedProject: null,
  members: [],
  currentUserRole: null,

  setSelectedProject: (project) => set({ selectedProject: project }),

  clearSelectedProject: () =>
    set({
      selectedProject: null,
      members: [],
      currentUserRole: null,
    }),

  setMembers: (members) => set({ members }),

  setCurrentUserRole: (role) => set({ currentUserRole: role }),
}));
