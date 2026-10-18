import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockIsNative, mockRequestPermissions } = vi.hoisted(() => ({
  mockIsNative: vi.fn(),
  mockRequestPermissions: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: mockIsNative },
  registerPlugin: () => ({ requestPermissions: mockRequestPermissions }),
}));

import { ensureBluetoothPermissions } from "./bluetooth-permission";

describe("ensureBluetoothPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("langsung true di web (bukan native) tanpa memanggil plugin", async () => {
    mockIsNative.mockReturnValue(false);
    expect(await ensureBluetoothPermissions()).toBe(true);
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it("true saat native dan izin diberikan", async () => {
    mockIsNative.mockReturnValue(true);
    mockRequestPermissions.mockResolvedValue({ granted: true, scan: true, connect: true });
    expect(await ensureBluetoothPermissions()).toBe(true);
  });

  it("false saat native dan izin ditolak", async () => {
    mockIsNative.mockReturnValue(true);
    mockRequestPermissions.mockResolvedValue({ granted: false, scan: true, connect: false });
    expect(await ensureBluetoothPermissions()).toBe(false);
  });

  it("false saat plugin throw (aman, tidak crash)", async () => {
    mockIsNative.mockReturnValue(true);
    mockRequestPermissions.mockRejectedValue(new Error("nope"));
    expect(await ensureBluetoothPermissions()).toBe(false);
  });
});
