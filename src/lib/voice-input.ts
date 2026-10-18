"use client";

/**
 * Voice input via Web Speech API (browser/HP).
 * Dipakai untuk TEST akurasi sebelum implementasi Vosk native.
 * Butuh internet (proses di server Google). Hanya untuk fase test.
 */

export interface VoiceResult {
  text: string;
  isFinal: boolean;
}

type SpeechCallback = (r: VoiceResult) => void;

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

/** Cek apakah browser/HP mendukung voice input. */
export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export class VoiceInput {
  private rec: SpeechRecognitionInstance | null = null;
  private listening = false;

  constructor(
    private onResult: SpeechCallback,
    private onError: (msg: string) => void,
    private lang = "id-ID",
  ) {}

  start(): void {
    if (this.listening) return;
    const w = window as unknown as Record<string, new () => SpeechRecognitionInstance>;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      this.onError("Browser/HP tidak mendukung input suara.");
      return;
    }
    this.rec = new Ctor();
    this.rec.lang = this.lang;
    this.rec.interimResults = true;
    this.rec.continuous = false;

    this.rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const alt = last[0];
      // results[length-1] selalu hasil terbaru; isFinal tidak selalu tersedia di tipe ini
      this.onResult({ text: alt.transcript, isFinal: true });
    };
    this.rec.onerror = (e) => {
      this.listening = false;
      const msg =
        e.error === "not-allowed"
          ? "Izin mic ditolak. Aktifkan di pengaturan."
          : e.error === "no-speech"
            ? "Tidak ada suara terdeteksi. Coba lagi."
            : `Error: ${e.error}`;
      this.onError(msg);
    };
    this.rec.onend = () => {
      this.listening = false;
    };

    try {
      this.rec.start();
      this.listening = true;
    } catch {
      this.onError("Gagal memulai mic.");
    }
  }

  stop(): void {
    this.rec?.stop();
    this.listening = false;
  }

  get isListening(): boolean {
    return this.listening;
  }
}
