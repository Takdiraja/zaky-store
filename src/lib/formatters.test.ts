import { describe, it, expect } from "vitest";
import {
  formatTime,
  parseLocalDate,
  withCurrentTime,
  withDate,
} from "./formatters";

describe("parseLocalDate", () => {
  it("pins date-only strings to local midnight (no 07:00 WIB shift)", () => {
    const d = parseLocalDate("2026-08-14");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // August
    expect(d.getDate()).toBe(14);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("passes full ISO timestamps through unchanged", () => {
    const d = parseLocalDate("2026-08-14T09:30:00.000Z");
    expect(d.toISOString()).toBe("2026-08-14T09:30:00.000Z");
  });
});

describe("formatTime", () => {
  // Some ICU builds render "16:30", others "16.30" for id-ID — normalize the
  // separator so the test is robust across environments.
  const hhmm = (t: string) => t.replace(".", ":");

  it("renders the local time of a full ISO timestamp", () => {
    // 09:30 UTC → 16:30 WIB (UTC+7). If the test machine is not in UTC+7
    // this simply renders the local equivalent — the key regression this
    // guards against is a date-only string showing 07:00 WIB.
    expect(hhmm(formatTime("2026-08-14T09:30:00.000Z"))).toMatch(/^\d{2}:\d{2}$/);
  });

  it("renders 00:00 for a date-only string, not 07:00", () => {
    expect(hhmm(formatTime("2026-08-14"))).toBe("00:00");
  });
});

describe("withCurrentTime", () => {
  it("keeps the chosen date and stamps the current clock time", () => {
    const before = new Date();
    const out = withCurrentTime("2026-08-14");
    const after = new Date();
    const d = new Date(out);

    expect(out.startsWith("2026-08-14")).toBe(true);
    // Local date components must match the chosen day.
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(14);
    // Time must be within the execution window (same minute).
    expect(d.getTime()).toBeGreaterThanOrEqual(before.getTime() - 60000);
    expect(d.getTime()).toBeLessThanOrEqual(after.getTime() + 60000);
  });
});

describe("withDate", () => {
  it("preserves the time-of-day while applying a new date", () => {
    const out = withDate("2026-08-14T09:30:00.000Z", "2026-09-20");
    const d = new Date(out);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // September
    expect(d.getDate()).toBe(20);
    // Same wall-clock time as the original timestamp.
    expect(d.getHours()).toBe(new Date("2026-08-14T09:30:00.000Z").getHours());
    expect(d.getMinutes()).toBe(30);
  });

  it("treats a date-only reference as 00:00 local, not UTC midnight", () => {
    // Legacy records store "YYYY-MM-DD". Editing one must not inherit the
    // 07:00 WIB UTC-midnight shift.
    const out = withDate("2026-08-14", "2026-09-20");
    const d = new Date(out);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(20);
    expect(d.getHours()).toBe(0);
  });

  it("falls back to the raw date when the timestamp is invalid", () => {
    expect(withDate("", "2026-09-20")).toBe("2026-09-20");
  });
});
