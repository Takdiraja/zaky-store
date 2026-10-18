"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, Zap, X, Check, Smartphone } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (blobOrFile: Blob | File) => void;
}

export default function ProductCameraModal({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    trackRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(
    async (targetFacing: "environment" | "user" = facingMode, deviceId?: string) => {
      stopStream();
      setLoadingCamera(true);
      setCameraError("");

      if (!navigator.mediaDevices) {
        setLoadingCamera(false);
        setCameraError("Kamera tidak didukung langsung oleh browser ini. Gunakan kamera bawaan HP di bawah.");
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: targetFacing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;

        // Cek dukungan senter / flash
        const caps = track.getCapabilities?.();
        // @ts-expect-error - torch adalah non-standard Web API
        setTorchSupported(Boolean(caps?.torch));

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setLoadingCamera(false);
      } catch (err: unknown) {
        setLoadingCamera(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          setCameraError("Izin kamera ditolak. Silakan izinkan di pengaturan browser atau gunakan kamera HP.");
        } else {
          setCameraError("Tidak dapat menyalakan kamera. Silakan gunakan kamera bawaan HP di bawah.");
        }
      }
    },
    [facingMode, stopStream]
  );

  // Inisialisasi daftar kamera dan stream saat dialog dibuka
  useEffect(() => {
    if (!open) {
      stopStream();
      setCapturedDataUrl(null);
      setCapturedBlob(null);
      setTorchOn(false);
      setTorchSupported(false);
      setCameraError("");
      return;
    }

    // Refresh daftar device
    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevs = devices.filter((d) => d.kind === "videoinput");
          setCameras(videoDevs);
        })
        .catch(() => {});
    }

    startStream("environment");

    return () => {
      stopStream();
    };
  }, [open, startStream, stopStream]);

  // Listener tombol Escape untuk menutup dialog
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Ganti kamera depan / belakang
  const handleToggleFacing = () => {
    if (cameras.length > 1) {
      const nextIdx = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIdx);
      startStream(facingMode, cameras[nextIdx].deviceId);
    } else {
      const nextFacing = facingMode === "environment" ? "user" : "environment";
      setFacingMode(nextFacing);
      startStream(nextFacing);
    }
  };

  // Toggle senter
  const handleToggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      const nextState = !torchOn;
      // @ts-expect-error - torch non-standard
      await track.applyConstraints({ advanced: [{ torch: nextState }] });
      setTorchOn(nextState);
    } catch {
      // Abaikan jika tidak didukung perangkat
    }
  };

  // Jepret foto dari live stream
  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    // Getar singkat haptic jika didukung
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch {
        // Abaikan
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedDataUrl(url);
      },
      "image/jpeg",
      0.9
    );
  };

  // Foto ulang
  const handleRetake = () => {
    if (capturedDataUrl) {
      URL.revokeObjectURL(capturedDataUrl);
    }
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Gunakan foto hasil jepretan
  const handleConfirmPhoto = () => {
    if (!capturedBlob) return;
    onCapture(capturedBlob);
    if (capturedDataUrl) {
      URL.revokeObjectURL(capturedDataUrl);
    }
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    onClose();
  };

  // Tangkap foto lewat kamera bawaan HP (fallback file input capture="environment")
  const handleNativeCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      onClose();
    }
    e.target.value = "";
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kamera Produk"
      className="fixed inset-0 z-[80] bg-black/95 flex flex-col justify-between select-none"
    >
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/40 text-white shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup kamera"
          className="h-11 px-3 rounded-lg flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <X className="size-5" />
          <span className="text-sm font-semibold">Tutup</span>
        </button>

        <span className="text-sm font-bold text-white tracking-wide">
          {capturedDataUrl ? "Pratinjau Foto" : "Ambil Foto Produk"}
        </span>

        <div className="flex items-center gap-2">
          {!capturedDataUrl && torchSupported && (
            <button
              type="button"
              onClick={handleToggleTorch}
              aria-label={torchOn ? "Matikan senter" : "Nyalakan senter"}
              className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
                torchOn ? "bg-secondary text-on-secondary" : "text-white/80 hover:text-white bg-white/10"
              }`}
            >
              <Zap className="size-5" />
            </button>
          )}

          {!capturedDataUrl && (cameras.length > 1 || !cameraError) && (
            <button
              type="button"
              onClick={handleToggleFacing}
              aria-label="Balik kamera"
              className="h-11 w-11 rounded-full flex items-center justify-center text-white/80 hover:text-white bg-white/10 active:bg-white/20 transition-colors"
            >
              <RefreshCw className="size-5" />
            </button>
          )}
        </div>
      </header>

      {/* Viewfinder / Preview Body */}
      <main className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        {capturedDataUrl ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={capturedDataUrl}
              alt="Hasil foto produk"
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Frame overlay pemandu produk */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
              <div className="w-full max-w-xs aspect-square border-2 border-dashed border-white/60 rounded-2xl flex items-end justify-center pb-3">
                <span className="bg-black/60 text-white/90 text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-xs">
                  Posisikan produk di dalam kotak
                </span>
              </div>
            </div>

            {loadingCamera && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-3 p-4">
                <RefreshCw className="size-8 animate-spin text-secondary" />
                <p className="text-sm font-medium">Menghubungkan ke kamera...</p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-white p-6 text-center max-w-md mx-auto">
                <Camera className="size-12 text-white/40 mb-3" />
                <p className="text-sm text-white/90 mb-4">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="h-12 px-6 rounded-xl bg-secondary text-on-secondary font-bold text-sm inline-flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  <Smartphone className="size-5" />
                  Buka Kamera Bawaan HP
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="px-4 py-4 bg-black/60 shrink-0">
        {capturedDataUrl ? (
          <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 h-12 rounded-xl bg-white/15 hover:bg-white/20 active:bg-white/25 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="size-4" />
              Foto Ulang
            </button>
            <button
              type="button"
              onClick={handleConfirmPhoto}
              className="flex-1 h-12 rounded-xl bg-secondary hover:brightness-110 active:brightness-90 text-on-secondary font-bold text-sm inline-flex items-center justify-center gap-2 shadow-lg transition-transform"
            >
              <Check className="size-5" />
              Gunakan Foto
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between max-w-sm mx-auto">
            {/* Opsi buka kamera HP langsung */}
            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="h-11 px-3 rounded-lg text-white/80 hover:text-white bg-white/10 active:bg-white/20 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Gunakan aplikasi kamera bawaan HP"
            >
              <Smartphone className="size-4" />
              Kamera HP
            </button>

            {/* Tombol Shutter Utama */}
            <button
              type="button"
              onClick={handleSnap}
              disabled={loadingCamera || Boolean(cameraError)}
              aria-label="Jepret foto produk"
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-transform shadow-xl"
            >
              <div className="w-13 h-13 rounded-full bg-white" />
            </button>

            {/* Spacer penyeimbang layout */}
            <div className="w-24" />
          </div>
        )}
      </footer>

      {/* Input file kamera bawaan HP (capture="environment") */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeCameraChange}
      />
    </div>
  );
}
