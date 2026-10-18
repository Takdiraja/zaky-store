import { Capacitor, registerPlugin } from "@capacitor/core";

export interface BluetoothPermissionResult {
  granted: boolean;
  scan: boolean;
  connect: boolean;
}

interface BluetoothPermissionPlugin {
  checkPermissions(): Promise<BluetoothPermissionResult>;
  requestPermissions(): Promise<BluetoothPermissionResult>;
}

const BluetoothPermission =
  registerPlugin<BluetoothPermissionPlugin>("BluetoothPermission");

/**
 * Memastikan izin Bluetooth (SCAN + CONNECT) diberikan sebelum
 * navigator.bluetooth.requestDevice() dipanggil.
 *
 * Di aplikasi native (Android 12+) izin runtime harus diminta lewat plugin
 * native — WebView tidak memintanya otomatis. Di web (browser), Web Bluetooth
 * mengatur izinnya sendiri lewat dialog browser, jadi langsung true.
 */
export async function ensureBluetoothPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const result = await BluetoothPermission.requestPermissions();
    return result.granted;
  } catch {
    return false;
  }
}
