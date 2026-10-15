"use client";

import { useState, useEffect } from "react";
import { Printer, Database, Palette, ChevronLeft, Moon } from "lucide-react";
import { usePrinterStore } from "@/stores/use-printer-store";
import { printerManager, type PrinterStatus } from "@/lib/printer-manager";
import { testPrintJob, PrintProgressDialog, type PrintJobState, type PrintPhase } from "@/components/shared/print-progress-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { useSettingsStore, DEFAULT_EDIT_PIN } from "@/stores/use-settings-store";
import { APP_NAME, STORE_ADDRESS } from "@/lib/constants";
import { Icon } from "@/lib/icon-map";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { exportToExcel } from "@/lib/export";
import { exportAllData } from "@/lib/backup";
import { useRouter } from "next/navigation";
import ThemePicker from "@/components/shared/theme-picker";

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
  } = usePrinterStore();
  const setEditPin = useSettingsStore((s) => s.setEditPin);
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("printer");
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(
    printerManager.getStatus(),
  );
  const [printState, setPrintState] = useState<PrintJobState>({ phase: "idle" as PrintPhase, error: null });
  const [printOpen, setPrintOpen] = useState(false);

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
    } catch {
      toast("Gagal mengexport data.", "error");
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
    } catch {
      toast("Gagal membuat backup.", "error");
    } finally {
      setBackingUp(false);
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

          {/* Store Info (fixed) */}
          <section className="space-y-2">
            <label className="block text-label-md font-semibold text-on-surface-variant">
              Info Toko di Nota
            </label>
            <div className="rounded-lg border border-border-standard bg-surface-container-low p-4">
              <p className="text-body-sm font-semibold text-on-surface">{printerName || APP_NAME}</p>
              <p className="mt-1 text-caption text-on-surface-variant">{STORE_ADDRESS}</p>
            </div>
            <p className="text-caption text-on-surface-variant">
              Alamat toko ditampilkan otomatis di setiap nota.
            </p>
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
            <h3 className="text-label-xl font-bold text-on-surface">Backup</h3>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Buat salinan cadangan seluruh data dalam satu file.
            </p>
            <button
              onClick={handleBackup}
              disabled={backingUp}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border-standard bg-card font-semibold text-on-surface-variant transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Icon name="save" size={18} />
              {backingUp ? "Membuat backup..." : "Buat Backup"}
            </button>
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
              <span className="rounded-full bg-muted px-3 py-1 text-caption font-semibold text-on-surface-variant">
                Segera hadir
              </span>
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
