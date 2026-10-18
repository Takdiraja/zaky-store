"use client";

import { useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/page-header";
import { VoiceInput, isVoiceSupported } from "@/lib/voice-input";

/**
 * Halaman TEST input suara — TERSEMBUNYI (tidak ada di navigasi).
 * Untuk uji akurasi speech-to-text bahasa Indonesia sebelum
 * implementasi Vosk native. Aman dihapus kapan saja.
 */
export default function VoiceTestPage() {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const voiceRef = useRef<VoiceInput | null>(null);

  const supported = isVoiceSupported();

  const toggle = () => {
    if (listening) {
      voiceRef.current?.stop();
      setListening(false);
      return;
    }
    setError("");
    const v = new VoiceInput(
      (r) => {
        setText(r.text);
        setLog((l) => [`${new Date().toLocaleTimeString("id-ID")}: "${r.text}"`, ...l].slice(0, 20));
      },
      (msg) => {
        setError(msg);
        setListening(false);
      },
    );
    voiceRef.current = v;
    v.start();
    setListening(true);
    // Auto-stop setelah 10 detik
    setTimeout(() => {
      v.stop();
      setListening(false);
    }, 10000);
  };

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Test Suara"
        subtitle="Halaman test tersembunyi — aman dihapus"
      />

      {!supported && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-body-md text-danger">
          Perangkat ini tidak mendukung input suara.
        </p>
      )}

      <div className="flex flex-col items-center gap-4 py-6">
        <button
          onClick={toggle}
          disabled={!supported}
          className={`flex size-24 items-center justify-center rounded-full shadow-fab transition-all active:scale-95 disabled:opacity-40 ${
            listening ? "bg-danger text-white animate-pulse" : "bg-secondary text-white"
          }`}
          aria-label={listening ? "Berhenti" : "Mulai bicara"}
        >
          {listening ? <Square className="size-10" /> : <Mic className="size-10" />}
        </button>
        <p className="text-body-md text-on-surface-variant">
          {listening ? "Mendengarkan... ngomong sekarang" : "Tekan mic lalu ngomong"}
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-body-md text-danger">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-border-standard bg-card p-5">
        <p className="mb-2 text-overline uppercase tracking-wider text-on-surface-variant">
          Hasil terakhir
        </p>
        <p className="text-headline-sm font-semibold text-on-surface min-h-8">
          {text || <span className="text-on-surface-variant/50">—</span>}
        </p>
      </div>

      {log.length > 0 && (
        <div className="rounded-2xl border border-border-standard bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-overline uppercase tracking-wider text-on-surface-variant">
              Riwayat test
            </p>
            <button
              onClick={() => setLog([])}
              className="flex items-center gap-1 text-body-sm text-on-surface-variant"
            >
              <Trash2 className="size-4" /> Hapus
            </button>
          </div>
          <ul className="space-y-2">
            {log.map((l, i) => (
              <li key={i} className="text-body-sm text-on-surface-variant font-mono">
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="px-1 text-caption text-on-surface-variant">
        Test: coba ngomong nama produk ("Indomie goreng"), angka ("lima puluh ribu"),
        dan kalimat kasbon ("kasbon Budi seratus ribu"). Nilai akurat atau tidak.
      </p>
    </div>
  );
}
