import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export interface SaveFileOptions {
  filename: string;
  data: string | ArrayBuffer | Uint8Array;
  mimeType: string;
  title?: string;
}

/**
 * Universal file saver:
 * - On Native APK (Android): writes file to cache and opens native Share dialog,
 *   allowing the user to save to Downloads/Drive or send to WhatsApp.
 * - On Web Browser: triggers browser download via Blob and <a download>.
 */
export async function saveOrShareFile(options: SaveFileOptions): Promise<void> {
  const { filename, data, mimeType, title = "Bagikan File" } = options;

  if (Capacitor.isNativePlatform()) {
    let writeData: string;
    let encoding: Encoding | undefined;

    if (typeof data === "string") {
      writeData = data;
      encoding = Encoding.UTF8;
    } else {
      // Binary data: convert ArrayBuffer or Uint8Array to Base64 for Filesystem
      const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
      }
      writeData = btoa(binary);
      encoding = undefined; // Capacitor decodes base64 when encoding is not set
    }

    const saved = await Filesystem.writeFile({
      path: filename,
      data: writeData,
      directory: Directory.Cache,
      encoding,
    });

    await Share.share({
      title,
      text: filename,
      url: saved.uri,
      dialogTitle: title,
    });
    return;
  }

  // Fallback untuk browser web desktop
  const blob =
    data instanceof Blob
      ? data
      : new Blob([data as any], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
