"use client";

import { useState, useEffect, useRef } from "react";
import { Printer, Database, Palette, ChevronLeft, Moon, QrCode, Camera, Image as ImageIcon, Upload } from "lucide-react";
import { usePrinterStore } from "@/stores/use-printer-store";
import { printerManager, type PrinterStatus, type NativePrinterDevice } from "@/lib/printer-manager";
import { testPrintJob, PrintProgressDialog, type PrintJobState, type PrintPhase } from "@/components/shared/print-progress-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { useSettingsStore, DEFAULT_EDIT_PIN } from "@/stores/use-settings-store";
import { APP_NAME, STORE_ADDRESS } from "@/lib/constants";
import { Icon } from "@/lib/icon-map";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { exportToExcel } from "@/lib/export";
import { exportAllData, importBackupData } from "@/lib/backup";
import { useRouter } from "next/navigation";
import ThemePicker from "@/components/shared/theme-picker";
import DarkModeToggle from "@/components/shared/dark-mode-toggle";
import { ensureBluetoothPermissions } from "@/lib/bluetooth-permission";
import { isValidQris, qrisInvalidReason, qrisMerchantName } from "@/lib/qris";
import { decodeQrFromFile } from "@/lib/qr-decode";
import { APP_VERSION, BUILD_TIME, GIT_HASH } from "@/lib/build-info";

type Tab = "printer" | "data" | "tampilan";

const DENSITY_OPTIONS = [
  { value: 1, label: "Terang" },
  { value: 2, label: "Agak Terang" },
  { value: 3, label: "Normal" },
  { value: 4, label: "Agak Gelap" },
  { value: 5, label: "Gelap" },
] as const;

const STATUS_LABEL: Record<PrinterStatus, string> = {
  unavailable: "Tidak didukung",
  disconnected: "Terputus",
  connecting: "Menghubungkan…",
  connected: "Terhubung",
  busy: "Sibuk",
};

export default function SettingsPage() {
  const router = useRouter();
  const {
    printerName,
    paperWidth,
    savedDeviceId,
    savedDeviceName,
    density,
    setPrinterName,
    setPaperWidth,
    setSavedDevice,
    setDensity,
    headerSize,
    setHeaderSize,
    showAddress,
    setShowAddress,
    showPhone,
    setShowPhone,
    footerText,
    setFooterText,
    storePhone,
    setStorePhone,
  } = usePrinterStore();
  const setEditPin = useSettingsStore((s) => s.setEditPin);
  const storeName = useSettingsStore((s) => s.storeName);
  const setStoreName = useSettingsStore((s) => s.setStoreName);
  const storeAddress = useSettingsStore((s) => s.storeAddress);
  const setStoreAddress = useSettingsStore((s) => s.setStoreAddress);
  const qrisPayload = useSettingsStore((s) => s.qrisPayload);
  const setQrisPayload = useSettingsStore((s) => s.setQrisPayload);
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("printer");
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedJsonContent, setSelectedJsonContent] = useState("");
  const [pastedJson, setPastedJson] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetPin, setResetPin] = useState("");
  const [resetting, setResetting] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [qrisInput, setQrisInput] = useState(qrisPayload);
  const [qrisError, setQrisError] = useState("");
  const [showForceSave, setShowForceSave] = useState(false);
  const [scanningQris, setScanningQris] = useState(false);
  const qrisFileRef = useRef<HTMLInputElement>(null);
  const qrisGalleryRef = useRef<HTMLInputElement>(null);
  const qrisMerchant = qrisPayload && isValidQris(qrisPayload) ? qrisMerchantName(qrisPayload) : "";

  const handleQrisPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanningQris(true);
    setQrisError("");
    try {
      const raw = await decodeQrFromFile(file);
      setQrisInput(raw);
      if (!isValidQris(raw)) {
        setQrisError("QR terbaca tapi bukan QRIS valid. Coba foto lain.");
      } else {
        toast(`QR terbaca (${qrisMerchantName(raw)}). Tekan Simpan.`, "success");
      }
    } catch (err) {
      setQrisError(err instanceof Error ? err.message : "Gagal membaca foto.");
    } finally {
      setScanningQris(false);
    }
  };

  const handleSaveQris = (force = false) => {
    const v = qrisInput.replace(/[\r\n]+/g, "").trim();
    if (!v) {
      setQrisPayload("");
      setQrisError("");
      setShowForceSave(false);
      toast("QRIS dihapus.", "success");
      return;
    }
    if (!force && !isValidQris(v)) {
      setQrisError(qrisInvalidReason(v) ?? "String QRIS tidak valid.");
      setShowForceSave(true);
      return;
    }
    setQrisError("");
    setShowForceSave(false);
    setQrisPayload(v);
    toast(`QRIS tersimpan.${force ? " (tanpa validasi CRC)" : ""}`, "success");
  };
  const handleClearQris = () => {
    setQrisInput("");
    setQrisPayload("");
    setQrisError("");
  };
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(
    printerManager.getStatus(),
  );
  const [printState, setPrintState] = useState<PrintJobState>({ phase: "idle" as PrintPhase, error: null });
  const [printOpen, setPrintOpen] = useState(false);
  // Native (APK): daftar printer ter-pair + dialog pilih printer.
  const [nativeDevices, setNativeDevices] = useState<NativePrinterDevice[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Reflect the REAL connection state, not just whether a device id is
  // saved. Subscribes to printerManager so drops/auto-reconnects update
  // the UI live.
  useEffect(() => {
    const refresh = () => setPrinterStatus(printerManager.getStatus());
    refresh();
    return printerManager.subscribe(refresh);
  }, []);

  const isConnected = printerManager.isConnected();

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // --- APK Android: pakai plugin native (daftar printer ter-pair) ---
      if (printerManager.isNative) {
        setLoadingDevices(true);
        try {
          const devices = await printerManager.listNativeDevices();
          setNativeDevices(devices);
          if (devices.length === 0) {
            toast("Tidak ada printer ter-pair. Pair dulu di Pengaturan Bluetooth HP.", "error");
            return;
          }
          setShowPicker(true);
        } catch (err) {
          toast(err instanceof Error ? err.message : "Gagal memuat daftar printer.", "error");
        } finally {
          setLoadingDevices(false);
          setConnecting(false);
        }
        return;
      }

      // --- Browser: Web Bluetooth chooser ---
      // Android 12+: minta izin Bluetooth dulu — tanpa ini requestDevice
      // pasti gagal (WebView tidak memintanya otomatis).
      const btGranted = await ensureBluetoothPermissions();
      if (!btGranted) {
        toast("Izin Bluetooth ditolak. Aktifkan di Pengaturan > Aplikasi > ZAKY STORE.", "error");
        return;
      }
      // Prefer silent reconnection to the already-saved device (no chooser);
      // only open the pairing dialog when nothing is saved or reconnect fails.
      const savedId = usePrinterStore.getState().savedDeviceId;
      const char = savedId
        ? await printerManager.reconnectSaved()
        : null;
      if (!char) {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            "000018f0-0000-1000-8000-00805f9b34fb",
            "0000ff00-0000-1000-8000-00805f9b34fb",
            "0000180f-0000-1000-8000-00805f9b34fb",
          ],
        });
        await printerManager.connect(device);
      }
      setPrinterStatus(printerManager.getStatus());
      if (printerManager.isConnected()) {
        toast("Printer terhubung.", "success");
      } else {
        toast("Gagal menghubungkan printer.", "error");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "NotFoundError") {
        toast("Gagal menghubungkan printer.", "error");
      }
      // NotFoundError = user cancelled
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    printerManager.disconnect();
    setSavedDevice(null, null);
    setPrinterStatus(printerManager.getStatus());
    toast("Printer diputuskan.", "info");
  };

  /** Dipilih dari dialog daftar printer native (APK Android). */
  const handlePickNativeDevice = async (d: NativePrinterDevice) => {
    setShowPicker(false);
    setConnecting(true);
    try {
      await printerManager.connectNative(d.address);
      setPrinterStatus(printerManager.getStatus());
      toast(`Printer "${d.name}" terhubung.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menghubungkan printer.", "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleTestPrint = async () => {
    if (!savedDeviceId) {
      toast("Hubungkan printer terlebih dahulu.", "error");
      return;
    }
    setTesting(true);
    setPrintOpen(true);
    setPrintState({ phase: "connecting", error: null });
    try {
      await testPrintJob(
        savedDeviceName || printerName || "Printer",
        paperWidth,
        (phase) => setPrintState({ phase, error: null }),
      );
      setPrinterStatus(printerManager.getStatus());
    } catch (err) {
      setPrintState({
        phase: "error",
        error: err instanceof Error ? err.message : "Gagal mencetak test.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSavePin = () => {
    const pin = pinInput.trim();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast("PIN harus 4 digit angka.", "error");
      return;
    }
    setSavingPin(true);
    try {
      setEditPin(pin);
      setPinInput("");
      toast("PIN edit transaksi diperbarui.", "success");
    } finally {
      setSavingPin(false);
    }
  };

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportToExcel();
      toast("Data berhasil diexport ke Excel.", "success");
    } catch (err) {
      console.error("[ExportExcel]", err);
      const msg = err instanceof Error ? err.message : "Gagal mengexport data.";
      toast(msg, "error");
    } finally {
      setExporting(false);
    }
  };

  const handleBackup = async () => {
    if (backingUp) return;
    setBackingUp(true);
    try {
      await exportAllData();
      toast("Backup berhasil dibuat.", "success");
    } catch (err) {
      console.error("[Backup]", err);
      const msg = err instanceof Error ? err.message : "Gagal membuat backup.";
      toast(msg, "error");
    } finally {
      setBackingUp(false);
    }
  };

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast("Pilih file backup dengan format .json", "error");
      return;
    }

    try {
      const text = await file.text();
      setSelectedFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      setSelectedJsonContent(text);
      toast("File backup berhasil dimuat.", "success");
    } catch {
      toast("Gagal membaca file backup.", "error");
    }
  };

  const handleExecuteRestore = async () => {
    const jsonStr = importTab === "file" ? selectedJsonContent : pastedJson.trim();
    if (!jsonStr) {
      toast(
        importTab === "file"
          ? "Silakan pilih file backup (.json) terlebih dahulu."
          : "Silakan tempel teks JSON backup terlebih dahulu.",
        "error",
      );
      return;
    }

    setImportingBackup(true);
    try {
      const res = await importBackupData(jsonStr);
      toast(`Berhasil memulihkan ${res.totalRecords} data (${res.collectionsRestored} kategori).`, "success");
      setShowImportModal(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error("[ImportBackup]", err);
      const msg = err instanceof Error ? err.message : "Gagal memulihkan backup.";
      toast(msg, "error");
    } finally {
      setImportingBackup(false);
    }
  };

  const handleResetData = async () => {
    const pin = useSettingsStore.getState().editPin;
    if (resetPin !== pin) {
      toast("PIN salah.", "error");
      return;
    }
    if (resetting) return;
    setResetting(true);
    try {
      const { resetAllDatabases, ALL_COLLECTIONS } = await import("@/lib/pouchdb");
      await resetAllDatabases(ALL_COLLECTIONS);
      // Bersihkan state zustand persist di localStorage agar fresh
      if (typeof window !== "undefined") {
        const keys = Object.keys(localStorage).filter(
          (k) => k.startsWith("app-settings") || k.includes("zustand") || k.includes("store"),
        );
        // Jangan hapus app-settings (nama toko, PIN, dll tetap)
        keys.forEach((k) => {
          if (!k.includes("app-settings")) localStorage.removeItem(k);
        });
      }
      toast("Semua data dihapus. Aplikasi akan dimuat ulang.", "success");
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast("Gagal mereset data.", "error");
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[560px] space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => router.back()}
          className="flex size-12 items-center justify-center rounded-md border border-border-standard bg-card text-on-surface transition-colors active:bg-surface-container"
          aria-label="Kembali"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-headline-md font-bold text-on-surface">Pengaturan</h1>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="printer" className="h-11 flex-1 gap-2">
            <Printer className="size-4" />
            Printer
          </TabsTrigger>
          <TabsTrigger value="data" className="h-11 flex-1 gap-2">
            <Database className="size-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="tampilan" className="h-11 flex-1 gap-2">
            <Palette className="size-4" />
            Tampilan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="printer" className="space-y-6 pt-4">
          {/* Printer Name */}
          <section className="space-y-2">
            <label className="block text-label-md font-semibold text-on-surface-variant">
              Nama Printer
            </label>
            <input
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              placeholder="XPrinter XP-58"
            />
          </section>

          {/* Paper Width */}
          <section className="space-y-2">
            <label className="block text-label-md font-semibold text-on-surface-variant">
              Lebar Kertas
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPaperWidth(58)}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-md font-semibold transition-all active:scale-[0.98] ${
                  paperWidth === 58
                    ? "bg-secondary text-white"
                    : "border border-border-standard bg-card text-on-surface-variant"
                }`}
              >
                <Icon name="receipt" size={18} />
                58 mm
              </button>
              <button
                onClick={() => setPaperWidth(80)}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-md font-semibold transition-all active:scale-[0.98] ${
                  paperWidth === 80
                    ? "bg-secondary text-white"
                    : "border border-border-standard bg-card text-on-surface-variant"
                }`}
              >
                <Icon name="receipt" size={18} />
                80 mm
              </button>
            </div>
          </section>

          {/* Print Density */}
          <section className="space-y-2">
            <label className="block text-label-md font-semibold text-on-surface-variant">
              Ketebalan Cetak
            </label>
            <p className="text-caption text-on-surface-variant">
              Pilih kegelapan hasil cetak. Normal adalah bawaan yang disarankan.
            </p>
            <div className="grid grid-cols-5 gap-2">
              {DENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDensity(opt.value)}
                  className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-md font-semibold transition-all active:scale-[0.98] ${
                    density === opt.value
                      ? "bg-secondary text-white"
                      : "border border-border-standard bg-card text-on-surface-variant"
                  }`}
                >
                  <span className="text-caption leading-none">{opt.label}</span>
                  <span className="text-overline leading-none">{opt.value}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Tampilan Struk */}
          <section className="space-y-3">
            <label className="block text-label-md font-semibold text-on-surface-variant">
              Tampilan Struk
            </label>

            <div>
              <p className="text-caption text-on-surface-variant mb-2">Ukuran nama toko</p>
              <div className="grid grid-cols-2 gap-2">
                {(["normal", "besar"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setHeaderSize(s)}
                    className={`h-12 rounded-md font-semibold capitalize transition-all active:scale-[0.98] ${
                      headerSize === s
                        ? "bg-secondary text-white"
                        : "border border-border-standard bg-card text-on-surface-variant"
                    }`}
                  >
                    {s === "normal" ? "Normal (aman 58mm)" : "Besar"}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between py-1">
              <span className="text-body-sm text-on-surface">Tampilkan alamat di struk</span>
              <button
                onClick={() => setShowAddress(!showAddress)}
                className={`relative h-7 w-12 rounded-full transition-colors ${showAddress ? "bg-secondary" : "bg-border-standard"}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${showAddress ? "left-6" : "left-1"}`} />
              </button>
            </label>

            <label className="flex items-center justify-between py-1">
              <span className="text-body-sm text-on-surface">Tampilkan no. HP di struk</span>
              <button
                onClick={() => setShowPhone(!showPhone)}
                className={`relative h-7 w-12 rounded-full transition-colors ${showPhone ? "bg-secondary" : "bg-border-standard"}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${showPhone ? "left-6" : "left-1"}`} />
              </button>
            </label>

            <div>
              <p className="text-caption text-on-surface-variant mb-2">Teks penutup struk</p>
              <input
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="Terima kasih"
                maxLength={40}
                className="h-12 w-full rounded-md border border-border-standard bg-card px-4 outline-none focus:border-secondary"
              />
            </div>
          </section>

          {/* Store Info */}
          <section className="space-y-2">            <label className="block text-label-md font-semibold text-on-surface-variant">
              Nama Toko di Nota
            </label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              placeholder="ZAKY STORE"
              maxLength={32}
            />
            <label className="block text-label-md font-semibold text-on-surface-variant pt-2">
              Alamat Toko di Nota
            </label>
            <textarea
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="min-h-20 w-full rounded-md border border-border-standard bg-card px-4 py-3 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              placeholder="Jl. ... "
              maxLength={120}
            />
            <label className="block text-label-md font-semibold text-on-surface-variant pt-2">
              No. HP Toko di Nota
            </label>
            <input
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              placeholder="08xx-xxxx-xxxx"
              inputMode="tel"
              maxLength={20}
            />
            <div className="rounded-lg border border-border-standard bg-surface-container-low p-4">
              <p className="text-body-sm font-semibold text-on-surface">{storeName || APP_NAME}</p>
              <p className="mt-1 text-caption text-on-surface-variant">{storeAddress || "—"}</p>
            </div>
            <p className="text-caption text-on-surface-variant">
              Nama dan alamat toko ditampilkan otomatis di setiap nota.
            </p>
          </section>

          {/* QRIS Toko */}
          <section className="space-y-2">
            <label className="block text-label-md font-semibold text-on-surface-variant">
              QRIS Toko
            </label>
            <p className="text-caption text-on-surface-variant">
              Tempel string QRIS tokomu atau foto QR-nya. QR pembayaran otomatis
              {` `}jadi dinamis mengikuti nominal transaksi.
              {qrisMerchant && (
                <span className="font-semibold text-success"> Terdaftar: {qrisMerchant}.</span>
              )}
            </p>
            <textarea
              value={qrisInput}
              onChange={(e) => { setQrisInput(e.target.value); setShowForceSave(false); setQrisError(""); }}
              className="min-h-20 w-full rounded-md border border-border-standard bg-card px-4 py-3 font-mono text-xs outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              placeholder="000201010212..."
              rows={3}
            />
            {qrisError && (
              <p className="text-caption text-danger-alert">{qrisError}</p>
            )}
            {qrisInput.trim() && (
              <p className="text-caption font-mono text-on-surface-variant">
                Panjang: {qrisInput.replace(/[\r\n]+/g, "").trim().length} karakter
                {(() => {
                  const v = qrisInput.replace(/[\r\n]+/g, "").trim();
                  if (v.length >= 8) {
                    const body = v.slice(0, -4);
                    const emb = v.slice(-4).toUpperCase();
                    // Hitung CRC inline (duplikat ringan biar tidak import)
                    let crc = 0xffff;
                    for (let i = 0; i < body.length; i++) {
                      crc ^= body.charCodeAt(i) << 8;
                      for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
                    }
                    const calc = crc.toString(16).toUpperCase().padStart(4, "0");
                    return ` · CRC string: ${emb} · CRC hitung: ${calc}`;
                  }
                  return "";
                })()}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => qrisFileRef.current?.click()}
                disabled={scanningQris}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-border-standard px-5 font-semibold text-on-surface disabled:opacity-50"
              >
                <Camera className="size-4" />
                {scanningQris ? "Membaca..." : "Foto QR"}
              </button>
              <input
                ref={qrisFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleQrisPhoto}
              />
              <button
                onClick={() => qrisGalleryRef.current?.click()}
                disabled={scanningQris}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-border-standard px-5 font-semibold text-on-surface disabled:opacity-50"
              >
                <ImageIcon className="size-4" />
                Pilih Gambar
              </button>
              <input
                ref={qrisGalleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrisPhoto}
              />
              <button
                onClick={() => handleSaveQris()}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-secondary px-5 font-semibold text-white transition-transform active:scale-[0.98]"
              >
                <QrCode className="size-4" />
                Simpan QRIS
              </button>
              {showForceSave && (
                <button
                  onClick={() => handleSaveQris(true)}
                  className="inline-flex h-11 items-center rounded-md border border-warning/50 bg-warning/10 px-5 font-semibold text-warning"
                >
                  Simpan Paksa
                </button>
              )}
              {qrisPayload && (
                <button
                  onClick={handleClearQris}
                  className="inline-flex h-11 items-center rounded-md border border-border-standard px-5 font-semibold text-on-surface-variant"
                >
                  Hapus
                </button>
              )}
            </div>
          </section>

          {/* PIN Edit Transaksi */}
          <section className="space-y-2">
            <label className="block text-label-md font-semibold text-on-surface-variant">
              PIN Edit Transaksi
            </label>
            <p className="text-caption text-on-surface-variant">
              Digunakan untuk mengedit transaksi.
              {!pinInput && (
                <span> PIN default: {DEFAULT_EDIT_PIN}.</span>
              )}
            </p>
            <div className="flex gap-2">
              <input
                value={pinInput}
                onChange={(e) =>
                  setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputMode="numeric"
                type="password"
                className="h-12 w-32 rounded-md border border-border-standard bg-card text-center text-body-md font-bold tracking-[0.5em] outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                placeholder="••••"
                maxLength={4}
              />
              <button
                onClick={handleSavePin}
                disabled={savingPin || pinInput.length !== 4}
                className="inline-flex h-12 items-center gap-1.5 rounded-md bg-secondary px-5 font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="lock" size={16} />
                {savingPin ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </section>

          {/* Separator */}
          <div className="border-t border-border-standard" />

          {/* Bluetooth Device */}
          <section className="space-y-3">
            <label className="block text-label-md font-semibold text-on-surface-variant">
              Perangkat Bluetooth
            </label>

            {/* Status */}
            <div className="flex items-center justify-between rounded-lg border border-border-standard bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div
                  className={`size-3 rounded-full ${
                    isConnected ? "bg-success" : printerStatus === "unavailable" ? "bg-danger" : "bg-outline"
                  }`}
                />
                <div>
                  <p className="text-body-md font-bold text-on-surface">
                    {isConnected
                      ? savedDeviceName || "Printer terdaftar"
                      : printerStatus === "unavailable"
                      ? "Tidak didukung"
                      : "Belum terhubung"}
                  </p>
                  {isConnected && (
                    <p className="text-caption text-on-surface-variant">
                      {STATUS_LABEL[printerStatus]} · ID: {savedDeviceId?.slice(0, 18)}...
                    </p>
                  )}
                  {!isConnected && printerStatus === "connecting" && (
                    <p className="text-caption text-on-surface-variant">Menghubungkan…</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {isConnected ? (
                <button
                  onClick={handleDisconnect}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-danger/30 bg-card font-semibold text-danger transition-all active:scale-[0.98]"
                >
                  <Icon name="delete" size={20} />
                  Putuskan Printer
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Icon name="bluetooth" size={20} />
                  {connecting ? "Menghubungkan..." : "Hubungkan Printer"}
                </button>
              )}

              <button
                onClick={handleTestPrint}
                disabled={!isConnected || testing}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-secondary bg-card font-semibold text-secondary transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="print" size={20} />
                {testing ? "Mencetak..." : "Cetak Test"}
              </button>
            </div>
          </section>

          {/* Dialog pilih printer (APK Android): daftar perangkat ter-pair */}
          {showPicker && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
              onClick={() => setShowPicker(false)}
            >
              <div
                className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-fab sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-label-xl font-bold text-on-surface">Pilih Printer</h3>
                <p className="mt-1 text-caption text-on-surface-variant">
                  Printer yang sudah di-pair di Bluetooth HP.
                </p>
                <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                  {nativeDevices.map((d) => (
                    <li key={d.address}>
                      <button
                        onClick={() => handlePickNativeDevice(d)}
                        className="flex w-full items-center justify-between rounded-lg border border-border-standard bg-surface-container-low p-4 text-left active:scale-[0.98]"
                      >
                        <div>
                          <p className="text-body-sm font-semibold text-on-surface">
                            {d.name || "Tanpa nama"}
                          </p>
                          <p className="text-caption font-mono text-on-surface-variant">
                            {d.address}
                          </p>
                        </div>
                        <Icon name="bluetooth" size={20} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowPicker(false)}
                  className="mt-4 h-12 w-full rounded-md border border-border-standard font-semibold text-on-surface-variant"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4 pt-4">
          <div className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
            <h3 className="text-label-xl font-bold text-on-surface">Export Data</h3>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Unduh seluruh data bisnis (produk, transaksi, pelanggan, kasbon, pengeluaran, modal) ke file Excel.
            </p>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Icon name="file_text" size={18} />
              {exporting ? "Mengexport..." : "Export ke Excel"}
            </button>
          </div>

          <div className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
            <h3 className="text-label-xl font-bold text-on-surface">Backup & Pulihkan Data</h3>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Buat salinan cadangan atau pulihkan seluruh data toko (produk, transaksi, pelanggan, kasbon, dll) dari file JSON backup.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={handleBackup}
                disabled={backingUp || importingBackup}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border-standard bg-card font-semibold text-on-surface-variant transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="save" size={18} />
                {backingUp ? "Membuat backup..." : "Buat Backup"}
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                disabled={backingUp || importingBackup}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary font-semibold text-white shadow-fab transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Upload size={18} />
                {importingBackup ? "Memulihkan..." : "Pulihkan / Import"}
              </button>
            </div>
          </div>

          {/* Modal Pulihkan / Import Data */}
          {showImportModal && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
              onClick={() => !importingBackup && setShowImportModal(false)}
            >
              <div
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border-standard bg-card p-5 shadow-fab sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border-standard pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Upload size={20} />
                    </div>
                    <div>
                      <h3 className="text-label-xl font-bold text-on-surface">Pulihkan Data Toko</h3>
                      <p className="text-caption text-on-surface-variant">Restore database dari file backup</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowImportModal(false)}
                    disabled={importingBackup}
                    className="flex size-9 items-center justify-center rounded-md border border-border-standard bg-surface-container-low text-on-surface-variant active:scale-95"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>

                <div className="mt-4 flex rounded-lg border border-border-standard bg-surface-container-low p-1">
                  <button
                    type="button"
                    onClick={() => setImportTab("file")}
                    className={`flex-1 rounded-md py-2 text-body-sm font-semibold transition-all ${
                      importTab === "file" ? "bg-card text-on-surface shadow-xs" : "text-on-surface-variant"
                    }`}
                  >
                    Pilih File (.json)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTab("paste")}
                    className={`flex-1 rounded-md py-2 text-body-sm font-semibold transition-all ${
                      importTab === "paste" ? "bg-card text-on-surface shadow-xs" : "text-on-surface-variant"
                    }`}
                  >
                    Tempel Teks JSON
                  </button>
                </div>

                {importTab === "file" ? (
                  <div className="mt-4 space-y-3">
                    <label
                      htmlFor="import-file-picker"
                      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-standard bg-surface-container-low p-6 text-center transition-colors active:bg-surface-container"
                    >
                      <Upload className="size-8 text-primary" />
                      <div>
                        <p className="text-body-sm font-semibold text-on-surface">
                          Klik untuk memilih file backup
                        </p>
                        <p className="mt-0.5 text-caption text-on-surface-variant">
                          Mendukung file .json yang diunduh dari Buat Backup
                        </p>
                      </div>
                      <input
                        id="import-file-picker"
                        type="file"
                        accept=".json,application/json"
                        onChange={handleSelectFile}
                        className="sr-only"
                      />
                    </label>

                    {selectedFileName && (
                      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-body-sm font-medium text-primary">
                        <Icon name="check_circle" size={18} />
                        <span className="truncate flex-1">{selectedFileName}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <label className="text-caption font-semibold text-on-surface-variant">
                      Isi Teks JSON Backup:
                    </label>
                    <textarea
                      value={pastedJson}
                      onChange={(e) => setPastedJson(e.target.value)}
                      placeholder='Tempel (paste) isi file backup di sini...'
                      rows={6}
                      className="w-full rounded-lg border border-border-standard bg-surface-container-low p-3 font-mono text-caption text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    disabled={importingBackup}
                    className="h-12 flex-1 rounded-md border border-border-standard font-semibold text-on-surface-variant active:scale-[0.98]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={importingBackup || (importTab === "file" ? !selectedJsonContent : !pastedJson.trim())}
                    className="h-12 flex-1 rounded-md bg-primary font-semibold text-white shadow-fab transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {importingBackup ? "Memulihkan..." : "Pulihkan Sekarang"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-danger/30 bg-card p-5 shadow-card">
            <h3 className="text-label-xl font-bold text-danger">Reset Data</h3>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Hapus SEMUA data di HP ini (produk, transaksi, pelanggan, kasbon, dll).
              Tidak bisa dibatalkan. Lakukan backup dulu jika perlu.
            </p>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-danger font-semibold text-white transition-all active:scale-[0.98]"
              >
                <Icon name="delete" size={18} />
                Reset Semua Data
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-body-sm font-semibold text-danger">
                  Yakin? Ketik PIN edit transaksi untuk konfirmasi.
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  value={resetPin}
                  onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="PIN"
                  className="h-12 w-full rounded-md border border-danger/30 bg-card px-4 text-center text-lg tracking-widest outline-none focus:border-danger"
                  maxLength={6}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setConfirmReset(false); setResetPin(""); }}
                    className="h-12 flex-1 rounded-md border border-border-standard font-semibold text-on-surface-variant"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleResetData}
                    disabled={resetting}
                    className="h-12 flex-1 rounded-md bg-danger font-semibold text-white disabled:opacity-50"
                  >
                    {resetting ? "Menghapus..." : "Ya, Hapus Semua"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tampilan" className="space-y-6 pt-4">
          <section>
            <h3 className="text-label-xl font-bold text-on-surface">Tema Warna</h3>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Pilih tema yang nyaman untuk penggunaan sehari-hari. Perubahan
              diterapkan langsung dan tersimpan otomatis.
            </p>
            <div className="mt-4">
              <ThemePicker />
            </div>
          </section>

          <section>
            <h3 className="text-label-xl font-bold text-on-surface">Mode Gelap</h3>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border-standard bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-muted text-on-surface-variant">
                  <Moon className="size-5" />
                </span>
                <div>
                  <p className="text-body-sm font-semibold text-on-surface">Mode Gelap</p>
                  <p className="text-caption text-on-surface-variant">
                    Mengurangi silau saat digunakan di tempat gelap.
                  </p>
                </div>
              </div>
              <DarkModeToggle />
            </div>
          </section>

          {/* Spike PouchDB — hapus setelah migrasi penuh */}
          <section>
            <h3 className="text-label-xl font-bold text-on-surface">Tes PouchDB</h3>
            <button
              onClick={() => router.push("/pouch-test")}
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-border-standard bg-card p-4 text-left shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-muted text-on-surface-variant">
                  <Database className="size-5" />
                </span>
                <div>
                  <p className="text-body-sm font-semibold text-on-surface">Tes PouchDB (Spike)</p>
                  <p className="text-caption text-on-surface-variant">
                    Uji database lokal + sync ke server.
                  </p>
                </div>
              </div>
              <ChevronLeft className="size-5 rotate-180 text-on-surface-variant" />
            </button>
          </section>

          {/* Tentang Aplikasi */}
          <section className="space-y-2">
            <h3 className="text-label-xl font-bold text-on-surface">Tentang</h3>
            <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-body-sm font-semibold text-on-surface">ZAKY STORE</p>
                <p className="text-caption font-mono text-on-surface-variant">
                  v{APP_VERSION}
                </p>
              </div>
              <p className="mt-1 text-caption text-on-surface-variant">
                Build: {BUILD_TIME} ({GIT_HASH})
              </p>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* Print progress + retry */}
      <PrintProgressDialog
        open={printOpen}
        state={printState}
        onRetry={handleTestPrint}
        onClose={() => {
          setPrintOpen(false);
          setPrintState({ phase: "idle" as PrintPhase, error: null });
        }}
      />
    </div>
  );
}
