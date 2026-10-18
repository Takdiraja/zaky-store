import { create } from "zustand";

interface UIStore {
  isSideNavOpen: boolean;
  toggleSideNav: () => void;
  closeSideNav: () => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSideNavOpen: false,
  toggleSideNav: () => set((s) => ({ isSideNavOpen: !s.isSideNavOpen })),
  closeSideNav: () => set({ isSideNavOpen: false }),
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
