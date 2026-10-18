import { Capacitor, registerPlugin } from "@capacitor/core";

export interface NativePrinterDevice {
  name: string;
  address: string;
}

interface BluetoothPrinterPlugin {
  listPairedDevices(): Promise<{ devices: NativePrinterDevice[] }>;
  connect(opts: { address: string }): Promise<{ connected: boolean; deviceName: string }>;
  print(opts: { data: string }): Promise<{ success: boolean }>;
  disconnect(): Promise<{ disconnected: boolean }>;
  isConnected(): Promise<{ connected: boolean; deviceName: string | null }>;
}

const NativePrinter = registerPlugin<BluetoothPrinterPlugin>("BluetoothPrinter");

/** true kalau jalan di APK Android (Web Bluetooth tidak tersedia di WebView). */
export function useNativePrinter(): boolean {
  return Capacitor.isNativePlatform();
}

/** Daftar printer yang sudah di-pair di pengaturan Bluetooth HP. */
export async function listNativePrinters(): Promise<NativePrinterDevice[]> {
  const r = await NativePrinter.listPairedDevices();
  return r.devices ?? [];
}

/** Konek ke printer via alamat MAC. */
export async function connectNativePrinter(address: string): Promise<string> {
  const r = await NativePrinter.connect({ address });
  return r.deviceName;
}

/** Kirim bytes ESC/POS (base64) ke printer. */
export async function printNative(data: Uint8Array): Promise<void> {
  // Uint8Array -> base64
  let bin = "";
  const chunk = 8192;
  for (let i = 0; i < data.length; i += chunk) {
    bin += String.fromCharCode(...data.subarray(i, i + chunk));
  }
  await NativePrinter.print({ data: btoa(bin) });
}

/** Status koneksi printer native. */
export async function isNativePrinterConnected(): Promise<boolean> {
  const r = await NativePrinter.isConnected();
  return r.connected;
}

export async function disconnectNativePrinter(): Promise<void> {
  await NativePrinter.disconnect();
}
