import { create } from 'zustand';

export const useTeacherSessionStore = create((set) => ({
  selectedClassSession: null,
  setSelectedClassSession: (session) => set({ selectedClassSession: session }),
  clearSelectedClassSession: () => set({ selectedClassSession: null }),
}));
