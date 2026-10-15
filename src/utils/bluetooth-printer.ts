import { printerManager } from "@/lib/printer-manager";
import { renderReceipt, renderTestPage, type DensityLevel } from "@/lib/escpos-renderer";
import { usePrinterStore } from "@/stores/use-printer-store";
import type { PaperWidth } from "@/types";

/**
 * Backward-compatible shim for the original Bluetooth printer API.
 * All functions now delegate to the new PrinterManager / EscPosRenderer
 * modules. Existing callers keep working unchanged.
 */

export function serializeDeviceId(device: BluetoothDevice): string {
  return device.id;
}

/** Requests a printer via the browser chooser (first-time setup). */
export async function requestPrinter(): Promise<BluetoothDevice> {
  if (typeof navigator === "undefined" || !navigator.bluetooth) {
    throw new Error("Web Bluetooth tidak didukung di browser ini.");
  }
  return navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "0000ff00-0000-1000-8000-00805f9b34fb",
      "0000180f-0000-1000-8000-00805f9b34fb",
    ],
  });
}

/**
 * Reconnects to a saved device. Uses the persistent manager so the live
 * connection is reused when possible; only falls back to the chooser when
 * the connection is actually lost.
 */
export async function reconnectPrinter(savedDeviceId: string): Promise<BluetoothDevice | null> {
  const characteristic = await printerManager.getCharacteristic();
  if (!characteristic) {
    // Last-resort: let the caller pick a device explicitly.
    try {
      return await requestPrinter();
    } catch {
      return null;
    }
  }
  return {
    id: savedDeviceId,
    name: usePrinterStore.getState().savedDeviceName,
    gatt: { connected: true } as BluetoothRemoteGATTServer,
  } as BluetoothDevice;
}

/**
 * Prints a receipt to the connected printer (persistent connection).
 */
export async function printReceipt(
  device: BluetoothDevice,
  text: string,
  paperWidth: PaperWidth,
): Promise<void> {
  const density = usePrinterStore.getState().density as DensityLevel;
  const data = renderReceipt(text, { paperWidth, density });
  await printerManager.write(data);
}

/**
 * Prints a test page.
 */
export async function testPrint(device: BluetoothDevice): Promise<void> {
  const density = usePrinterStore.getState().density as DensityLevel;
  const data = renderTestPage(device.name || "Printer", { paperWidth: 58, density });
  await printerManager.write(data);
}
