import type { PaperWidth } from "@/types";

/**
 * High-quality ESC/POS byte-stream renderer.
 *
 * Produces a professional thermal receipt with:
 *  - printer init (reset, CP437, line spacing, buzzer, print density)
 *  - per-line alignment (left/center/right), bold, and double-size modes
 *  - CP437-compatible Indonesian character mapping
 *  - width-exact column layout (no tabs)
 *  - feed + cut at the end
 *
 * The input is the plain-text receipt from `receipt-formatter.ts` where
 * alignment was already computed with spaces; here we additionally emit
 * ESC/POS mode commands for the lines that need emphasis.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

/* ── Low-level byte helpers ── */

export function escPos(...args: number[]): Uint8Array {
  return new Uint8Array(args);
}

export function bytesOf(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export function textBytes(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 0x0a) {
      out.push(0x0a);
    } else if (code < 128) {
      out.push(code);
    } else {
      const mapped = CP437_MAP[code];
      out.push(mapped ?? 0x20); // safe ASCII fallback (space) for unmapped glyphs
    }
  }
  return new Uint8Array(out);
}

/**
 * Small CP437 (code page 437) mapping for the Latin-1 characters used in
 * Indonesian receipts. Unmapped glyphs fall back to a space so we never
 * emit stray bytes that print as garbage.
 */
const CP437_MAP: Record<number, number> = {
  0x00a0: 0x20, // NBSP → space
  0x00a1: 0xad, // ¡
  0x00a2: 0x9b, // ¢
  0x00a3: 0x9c, // £
  0x00a5: 0x9d, // ¥
  0x00aa: 0xa6, // ª
  0x00ab: 0xae, // «
  0x00ac: 0xaa, // ¬
  0x00b0: 0xf8, // °
  0x00b1: 0xf1, // ±
  0x00b2: 0xfd, // ²
  0x00b3: 0xfc, // ³
  0x00b5: 0xe6, // µ
  0x00b6: 0x14, // ¶
  0x00b7: 0xfa, // ·
  0x00b9: 0xf9, // ¹
  0x00ba: 0xa7, // º
  0x00bb: 0xaf, // »
  0x00bc: 0xac, // ¼
  0x00bd: 0xab, // ½
  0x00be: 0xf3, // ¾
  0x00bf: 0xa8, // ¿
  0x00c0: 0xb7, // À
  0x00c1: 0xb5, // Á
  0x00c2: 0xb6, // Â
  0x00c7: 0x80, // Ç
  0x00c8: 0x8a, // È
  0x00c9: 0x82, // É
  0x00ca: 0x8b, // Ê
  0x00cb: 0x8c, // Ë
  0x00cc: 0x8e, // Ì
  0x00cd: 0x8f, // Í
  0x00ce: 0x90, // Î
  0x00cf: 0x92, // Ï
  0x00d1: 0xa5, // Ñ
  0x00d3: 0x94, // Ó
  0x00d4: 0x95, // Ô
  0x00d6: 0x99, // Ö
  0x00d7: 0x9e, // ×
  0x00d8: 0x9f, // Ø
  0x00d9: 0x96, // Ù
  0x00da: 0x97, // Ú
  0x00db: 0x98, // Û
  0x00dc: 0x93, // Ü
  0x00dd: 0x9a, // Ý
  0x00e0: 0x85, // à
  0x00e1: 0x83, // á
  0x00e2: 0x84, // â
  0x00e7: 0x87, // ç
  0x00e8: 0x8d, // è
  0x00e9: 0x86, // é
  0x00ea: 0x88, // ê
  0x00eb: 0x89, // ë
  0x00ec: 0x8d, // ì
  0x00ed: 0x8f, // í
  0x00ee: 0x90, // î
  0x00ef: 0x91, // ï
  0x00f1: 0xa4, // ñ
  0x00f2: 0x95, // ò
  0x00f3: 0x94, // ó
  0x00f4: 0x95, // ô
  0x00f6: 0x99, // ö
  0x00f7: 0xa1, // ÷
  0x00f9: 0x96, // ù
  0x00fa: 0x97, // ú
  0x00fb: 0x98, // û
  0x00fc: 0x93, // ü
  0x00ff: 0x98, // ÿ
  // Emoji / pictographs (like 🙏) have no CP437 glyph → fall back to a
  // safe printable approximation so the line still reads.
  0x1f64f: 0x2a, // 🙏 → "*" (placeholder heart-hands)
};

export type DensityLevel = 1 | 2 | 3 | 4 | 5;

/* ── Mode commands ── */

/** Alignment: 0 = left, 1 = center, 2 = right (ESC a n). */
export function align(n: 0 | 1 | 2): Uint8Array {
  return escPos(ESC, 0x61, n);
}

/** Bold on/off (ESC E n). */
export function bold(on: boolean): Uint8Array {
  return escPos(ESC, 0x45, on ? 1 : 0);
}

/** Double-width+height via GS ! (print mode). */
export function doubleSize(): Uint8Array {
  // Font A (12×24) doubled: 0x30 = double height + double width.
  return escPos(GS, 0x21, 0x30);
}

/** Double-width only via GS !. */
export function doubleWidth(): Uint8Array {
  return escPos(GS, 0x21, 0x10);
}

/** Double-height only via GS ! (0x20) — taller but keeps line width. */
export function doubleHeight(): Uint8Array {
  return escPos(GS, 0x21, 0x20);
}

/** Reset print mode to normal (GS ! 0). */
export function normalSize(): Uint8Array {
  return escPos(GS, 0x21, 0x00);
}

/**
 * Print density (darkness). Common command: GS ( E 2 48 n 0 — the
 * three-byte parameter variant supported by many ESC/POS thermal printers
 * (Epson-compatible). n in 1..5; 3 is a good medium-dark default.
 */
export function densityCommand(level: number): Uint8Array {
  const n = Math.max(1, Math.min(5, Math.round(level)));
  return escPos(GS, 0x28, 0x45, 0x02, 0x30, n, 0x00);
}

/** Full init: reset, CP437, default line spacing, buzzer, density. */
export function initSequence(level: DensityLevel): Uint8Array {
  return bytesOf(
    escPos(ESC, 0x40), // ESC @ reset
    escPos(ESC, 0x74, 0x00), // ESC t 0 → CP437
    escPos(ESC, 0x32), // ESC 2 → default line spacing
    escPos(GS, 0x62, 0x01), // GS b 1 → buzzer at end (many printers)
    densityCommand(level), // darkness
  );
}

/** Final feed + cut (full cut with 4-line feed — safe for partial-cut). */
export function finishSequence(feedLines = 5): Uint8Array {
  return bytesOf(
    escPos(ESC, 0x64, feedLines), // ESC d n → feed n lines
    escPos(GS, 0x56, 0x41), // GS V 65 → full cut
  );
}

/**
 * Renders one plain-text line with an optional ESC/POS mode:
 *  - center: ESC a 1 before, ESC a 0 after
 *  - big: GS ! double width+height (line is centered, e.g. store name)
 *  - tall: GS ! double height only (token codes — keeps column width)
 *  - bold: ESC E before/after
 */
function renderLine(line: string, opts: { center?: boolean; bold?: boolean; big?: boolean; tall?: boolean }): Uint8Array {
  const chunks: Uint8Array[] = [];
  if (opts.center) chunks.push(align(1));
  if (opts.big) chunks.push(doubleSize());
  if (opts.tall) chunks.push(doubleHeight());
  if (opts.bold) chunks.push(bold(true));
  chunks.push(textBytes(line));
  if (opts.bold) chunks.push(bold(false));
  if (opts.tall) chunks.push(normalSize());
  if (opts.big) chunks.push(normalSize());
  if (opts.center) chunks.push(align(0));
  chunks.push(escPos(LF));
  return bytesOf(...chunks);
}

export interface RenderOptions {
  paperWidth: PaperWidth;
  density?: DensityLevel;
  /** Store name shown in the header — centered + bold + doubled. */
  storeName?: string;
}

/**
 * Renders the plain-text receipt (from receipt-formatter) into a full
 * ESC/POS byte stream. Lines that begin with the special markers are given
 * emphasis; everything else prints as-is (alignment already in the text).
 */
export function renderReceipt(text: string, opts: RenderOptions): Uint8Array {
  const chunks: Uint8Array[] = [initSequence(opts.density ?? 3)];

  // Split into physical lines (blank lines preserved as LF-only).
  const lines = text.split("\n");
  // Header state: 0 = before store name, 1 = store name (bold/double),
  // 2 = address/phone lines right after the store name (centered),
  // 3 = past the header (everything else left-aligned).
  let headerState = 0;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (line === "") {
      chunks.push(escPos(LF));
      // A blank line ends the centered header block (if we were in it).
      if (headerState > 0) headerState = 3;
      continue;
    }

    if (headerState === 0) {
      // Store name — first non-blank line: center + bold + double.
      headerState = 1;
      chunks.push(renderLine(line, { center: true, bold: true, big: true }));
      continue;
    }

    if (headerState === 1 || headerState === 2) {
      // Address / phone lines directly after the store name are centered.
      const isSeparator = /^[=\-]{4,}$/.test(trimmed);
      const looksLikeMeta = trimmed.includes(":");
      if (isSeparator || looksLikeMeta) {
        headerState = 3;
        chunks.push(renderLine(line, {}));
        continue;
      }
      // Address/phone — center them.
      headerState = 2;
      chunks.push(renderLine(line, { center: true }));
      continue;
    }

    // Everything else — alignment is already baked into the text.
    // Lines prefixed with "@@" are emphasized (large + bold) on paper —
    // used for the PLN token code so it stands out on the receipt.
    if (line.startsWith("@@")) {
      chunks.push(renderLine(line.slice(2), { tall: true, bold: true }));
      continue;
    }
    chunks.push(renderLine(line, {}));
  }

  chunks.push(finishSequence());
  return bytesOf(...chunks);
}

/** Builds a test-page byte stream for the settings "Cetak Test" button. */
export function renderTestPage(deviceName: string, opts: RenderOptions): Uint8Array {
  const chunks: Uint8Array[] = [initSequence(opts.density ?? 3)];

  chunks.push(renderLine("", {}));
  chunks.push(renderLine("ZAKY STORE", { center: true, bold: true, big: true }));
  chunks.push(renderLine("=== TEST PRINT ===", { center: true }));
  chunks.push(renderLine("", {}));
  chunks.push(renderLine(`Printer: ${deviceName || "N/A"}`, {}));
  chunks.push(renderLine("", {}));
  chunks.push(renderLine("Normal text", {}));
  chunks.push(renderLine("Bold text", { bold: true }));
  chunks.push(renderLine("", {}));
  chunks.push(renderLine("Alignment:", {}));
  chunks.push(renderLine("Left", {}));
  chunks.push(renderLine("      Center", { center: true }));
  chunks.push(renderLine("                  Right", {}));
  chunks.push(renderLine("", {}));
  chunks.push(renderLine("A B C D E F G H I J K L M", {}));
  chunks.push(renderLine("N O P Q R S T U V W X Y Z", {}));
  chunks.push(renderLine("0 1 2 3 4 5 6 7 8 9", {}));
  chunks.push(renderLine("", {}));
  chunks.push(renderLine("Jika teks ini terbaca jelas,", {}));
  chunks.push(renderLine("printer berfungsi dengan baik!", {}));
  chunks.push(renderLine("", {}));
  chunks.push(renderLine("Terima kasih", { center: true }));
  chunks.push(renderLine("", {}));

  chunks.push(finishSequence());
  return bytesOf(...chunks);
}
