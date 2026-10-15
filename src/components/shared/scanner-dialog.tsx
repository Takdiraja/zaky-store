"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BarcodeDetector } from "barcode-detector";

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  mode?: "product" | "cashier" | "receipt";
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio not available
  }
}

export default function ScannerDialog({ open, onClose, onScan, mode = "product" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const scanningRef = useRef(false);
  const onScanRef = useRef(onScan);
  const debounceRef = useRef(false);
  const lastBarcodeRef = useRef<string | null>(null);
  const waitingClearRef = useRef(false);
  const mountedRef = useRef(false);

  const [processing, setProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  // Keep the latest onScan callback in a ref (updated via effect to avoid
  // writing refs during render).
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Keep a stable ref to scanFrame so startStream (defined earlier) can call it
  // without a use-before-declare error.
  const scanFrameRef = useRef<() => void>(() => {});

  // Initialise detector once
  useEffect(() => {
    detectorRef.current = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "code_93", "itf", "qr_code"],
    });
  }, []);

  const handleScan = useCallback((barcode: string) => {
    if (debounceRef.current) return;
    debounceRef.current = true;

    playBeep();
    setProcessing(true);
    lastBarcodeRef.current = barcode;
    waitingClearRef.current = true;
    onScanRef.current(barcode);

    setTimeout(() => {
      debounceRef.current = false;
      setProcessing(false);
    }, 800);
  }, []);

  const stopStream = useCallback(() => {
    scanningRef.current = false;
    lastBarcodeRef.current = null;
    waitingClearRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    trackRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(
    async (deviceId?: string) => {
      if (!mountedRef.current) return;

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;

        // Check torch support
        const caps = track.getCapabilities?.();
        // @ts-expect-error - torch is non-standard
        setTorchSupported(!!caps?.torch);

        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const video = document.getElementById("scanner-video") as HTMLVideoElement | null;
        if (!video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        video.srcObject = stream;
        videoRef.current = video;
        await video.play();

        setCameraError("");
        scanningRef.current = true;
        scanFrameRef.current();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          setCameraError("Akses kamera ditolak. Izinkan kamera di pengaturan browser.");
        } else {
          setCameraError("Kamera tidak tersedia. Pastikan perangkat memiliki kamera.");
        }
      }
    },
    [],
  );

  const scanFrame = useCallback(async () => {
    const detector = detectorRef.current;
    const video = videoRef.current;
    if (!detector || !video || !scanningRef.current) return;

    try {
      const barcodes = await detector.detect(video);

      if (waitingClearRef.current) {
        // Waiting for current barcode to leave frame
        if (barcodes.length === 0) {
          waitingClearRef.current = false;
        }
      } else if (barcodes.length > 0) {
        const barcode = barcodes[0];
        const raw = barcode.rawValue;
        const format = barcode.format;

        // In receipt mode, accept any detected code (QR or 1D) — the
        // payload is parsed downstream.
        const isReceiptMode = mode === "receipt";
        // QR codes are also accepted as product codes (many UMKM products
        // use QR); they are looked up by their raw string value.
        const isQr = format === "qr_code";
        if ((isReceiptMode || isQr) && raw) {
          handleScan(raw);
        } else {
          // Only accept known 1D product barcode formats with numeric-only values
          const isEanUpc = ["ean_13", "ean_8", "upc_a", "upc_e"].includes(format);
          const isNumeric = /^\d+$/.test(raw);

          if (!isEanUpc || !isNumeric) {
            // Skip non-product barcodes (GS1 DataBar, composite, etc.)
          } else if (debounceRef.current) {
            // Still in cooldown — skip
          } else if (raw === lastBarcodeRef.current) {
            // Same barcode reappeared after leaving — re-scan
            handleScan(raw);
          } else {
            // New barcode
            handleScan(raw);
          }
        }
      }
    } catch {
      // Frame skipped — continue scanning
    }

    if (scanningRef.current) {
      requestAnimationFrame(() => scanFrameRef.current());
    }
  }, [handleScan, mode]);

  // Keep the ref in sync so startStream can invoke the latest scanFrame.
  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({
        // @ts-expect-error - torch is non-standard
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch {
      // Torch toggle failed
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;

    try {
      stopStream();
      setTorchOn(false);
      setTorchSupported(false);
      setCurrentCameraIndex(nextIndex);
      await startStream(cameras[nextIndex].deviceId);
    } catch {
      // Camera switch failed — keep current
    }
  };

  // Enumerate cameras on mount
  useEffect(() => {
    if (!open) {
      // Reset camera state after this effect's frame to avoid a cascading render.
      queueMicrotask(() => {
        setCameras([]);
        setCurrentCameraIndex(0);
      });
      return;
    }

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoInputs);
      })
      .catch(() => {});
  }, [open]);

  // Start/stop camera on open/close
  useEffect(() => {
    mountedRef.current = open;

    if (!open) {
      scanningRef.current = false;
      stopStream();
      debounceRef.current = false;
      // Reset camera UI state after this effect's frame.
      queueMicrotask(() => {
        setProcessing(false);
        setTorchOn(false);
        setTorchSupported(false);
        setCameraError("");
      });
      return;
    }

    queueMicrotask(() => setCurrentCameraIndex(0));
    queueMicrotask(() => void startStream());

    return () => {
      mountedRef.current = false;
      scanningRef.current = false;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    scanningRef.current = false;
    stopStream();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={handleClose}
          className="text-white text-headline-md font-bold flex items-center gap-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Tutup
        </button>
        <div className="flex items-center gap-3">
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="Ganti kamera"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 8h-1.5a2 2 0 0 1-1.76-1.08L16 5.5a2 2 0 0 0-1.76-1.08H9.76A2 2 0 0 0 8 5.5l-.74 1.42A2 2 0 0 1 5.5 8H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>
          )}
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                torchOn ? "bg-secondary text-on-secondary" : "text-white/70"
              }`}
              aria-label={torchOn ? "Matikan senter" : "Nyalakan senter"}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {torchOn ? (
                  <>
                    <path d="M18 6L6 18" />
                    <path d="M22 12h-4" />
                    <path d="M16 8l-4 4" />
                    <path d="M2 12h4" />
                    <path d="M8 16l4-4" />
                  </>
                ) : (
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
                )}
              </svg>
            </button>
          )}
          <span className="text-white/70 text-label-md">
            Arahkan kamera ke barcode
          </span>
        </div>
      </div>

      {/* Scanner area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        <video id="scanner-video" className="w-full h-full object-cover" playsInline muted />

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="text-center max-w-sm">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger, #dc2626)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-white text-headline-md font-bold mb-2">Kamera Tidak Tersedia</p>
              <p className="text-white/60 text-body-md">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Overlay */}
        {!cameraError && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[28vw] max-w-[260px] max-h-[130px]"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)" }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[28vw] max-w-[260px] max-h-[130px]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-secondary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-secondary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-secondary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-secondary rounded-br-lg" />
            </div>
            {!processing && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-[45vw] max-w-[220px] h-px bg-secondary shadow-[0_0_10px_theme(colors.secondary.DEFAULT)]"
                style={{ top: "calc(50% - 60px)", animation: "scanLine 1.2s ease-in-out infinite" }}
              />
            )}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-white text-headline-md font-bold">Barcode terdeteksi!</p>
                  <p className="text-white/50 text-label-md mt-1">Memproses...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {!cameraError && (
        <div className="py-6 shrink-0">
          <p className="text-center text-white/60 text-body-md">
            {processing
              ? "Harap tunggu..."
              : mode === "cashier"
              ? "Scan barcode untuk menambahkan produk ke keranjang"
              : mode === "receipt"
              ? "Arahkan kamera ke QR di nota"
              : "Scan barcode produk untuk pengisian otomatis"}
          </p>
        </div>
      )}
      {cameraError && (
        <div className="py-6 shrink-0">
          <button
            onClick={handleClose}
            className="mx-auto block px-6 h-11 bg-card/10 text-white rounded-xl font-bold active:scale-95 transition-transform"
          >
            Tutup Scanner
          </button>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: calc(50% - 65px); opacity: 0.3; }
          50% { top: calc(50% + 65px); opacity: 1; }
        }
        #scanner-video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
