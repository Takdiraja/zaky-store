import { create } from "zustand";
import type { PeriodFilter } from "@/types";

interface ReportStore {
  period: PeriodFilter;
  customStart: string | null;
  customEnd: string | null;
  setPeriod: (p: PeriodFilter) => void;
  setCustomRange: (start: string, end: string) => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  period: "today",
  customStart: null,
  customEnd: null,

  setPeriod: (p) => set({ period: p, customStart: null, customEnd: null }),

  setCustomRange: (start, end) =>
    set({ period: "custom", customStart: start, customEnd: end }),
}));
