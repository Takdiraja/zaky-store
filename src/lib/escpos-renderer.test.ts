import { describe, it, expect } from "vitest";
import {
  align,
  bold,
  bytesOf,
  densityCommand,
  doubleSize,
  doubleWidth,
  doubleHeight,
  escPos,
  finishSequence,
  initSequence,
  normalSize,
  renderReceipt,
  renderTestPage,
  textBytes,
} from "./escpos-renderer";

function bytes(...n: number[]) {
  return new Uint8Array(n);
}

describe("escpos renderer", () => {
  it("escPos builds a Uint8Array of the given bytes", () => {
    expect(Array.from(escPos(0x1b, 0x40))).toEqual([0x1b, 0x40]);
  });

  it("bytesOf concatenates chunks", () => {
    const out = bytesOf(bytes(1, 2), bytes(3), bytes(4, 5));
    expect(Array.from(out)).toEqual([1, 2, 3, 4, 5]);
  });

  it("textBytes passes ASCII through and maps CP437 chars", () => {
    expect(Array.from(textBytes("ABC"))).toEqual([0x41, 0x42, 0x43]);
    // × (0xD7) → CP437 0x9E
    expect(Array.from(textBytes("×"))).toEqual([0x9e]);
    // — (0x2014) is not in the map → space fallback
    expect(Array.from(textBytes("—"))).toEqual([0x20]);
    // newline preserved
    expect(Array.from(textBytes("a\nb"))).toEqual([0x61, 0x0a, 0x62]);
  });

  it("initSequence emits reset, CP437, spacing, buzzer, density", () => {
    const init = initSequence(3);
    const arr = Array.from(init);
    expect(arr.slice(0, 2)).toEqual([0x1b, 0x40]); // ESC @
    expect(arr.slice(2, 4)).toEqual([0x1b, 0x74]); // ESC t
    expect(arr[4]).toBe(0x00); // CP437
    expect(arr.slice(5, 7)).toEqual([0x1b, 0x32]); // ESC 2
    expect(arr.slice(7, 10)).toEqual([0x1d, 0x62, 0x01]); // GS b 1
    // density: GS ( E 2 48 n 0
    expect(arr.slice(10, 17)).toEqual([0x1d, 0x28, 0x45, 0x02, 0x30, 3, 0x00]);
  });

  it("densityCommand clamps level to 1..5", () => {
    expect(Array.from(densityCommand(0))).toEqual([0x1d, 0x28, 0x45, 0x02, 0x30, 1, 0x00]);
    expect(Array.from(densityCommand(5))).toEqual([0x1d, 0x28, 0x45, 0x02, 0x30, 5, 0x00]);
    expect(Array.from(densityCommand(3))[5]).toBe(3);
  });

  it("mode helpers emit the right ESC/POS sequences", () => {
    expect(Array.from(align(1))).toEqual([0x1b, 0x61, 0x01]);
    expect(Array.from(align(0))).toEqual([0x1b, 0x61, 0x00]);
    expect(Array.from(bold(true))).toEqual([0x1b, 0x45, 0x01]);
    expect(Array.from(bold(false))).toEqual([0x1b, 0x45, 0x00]);
    expect(Array.from(doubleSize())).toEqual([0x1d, 0x21, 0x30]);
    expect(Array.from(doubleWidth())).toEqual([0x1d, 0x21, 0x10]);
    expect(Array.from(doubleHeight())).toEqual([0x1d, 0x21, 0x20]);
    expect(Array.from(normalSize())).toEqual([0x1d, 0x21, 0x00]);
  });

  it("finishSequence feeds 5 lines and cuts", () => {
    const f = finishSequence();
    const arr = Array.from(f);
    expect(arr.slice(0, 2)).toEqual([0x1b, 0x64]); // ESC d
    expect(arr[2]).toBe(5);
    expect(arr.slice(3, 6)).toEqual([0x1d, 0x56, 0x41]); // GS V 65
  });

  it("renderReceipt emphasizes the store name but not TOTAL", () => {
    const text = [
      "",
      "ZAKY STORE",
      "No Nota: TRX-1",
      "Kopi Susu 2 x Rp 12.000  Rp 24.000",
      "TOTAL  Rp 24.000",
      "TUNAI  Rp 50.000",
      "KEMBALI  Rp 26.000",
      "",
      "Terima kasih",
    ].join("\n");

    const data = renderReceipt(text, { paperWidth: 58 });
    const arr = Array.from(data);

    expect(arr.slice(0, 2)).toEqual([0x1b, 0x40]);
    // The store name line should be preceded by ESC a 1 (center) and GS ! 0x30.
    const storeBytes = Array.from(textBytes("ZAKY STORE"));
    const storeIdx = arr.findIndex((_, i) =>
      i + storeBytes.length <= arr.length &&
      arr.slice(i, i + storeBytes.length).every((v, j) => v === storeBytes[j]),
    );
    expect(storeIdx).toBeGreaterThan(0);
    const dblIdx = arr.lastIndexOf(0x30, storeIdx);
    expect(dblIdx).toBeGreaterThanOrEqual(0);
    expect(arr[dblIdx - 2]).toBe(0x1d);
    expect(arr[dblIdx - 1]).toBe(0x21);

    // TOTAL / TUNAI / KEMBALI lines are NOT emphasized: they must be plain
    // text with no GS ! double-size immediately before them.
    for (const label of ["TOTAL", "TUNAI", "KEMBALI"]) {
      const labelBytes = Array.from(textBytes(label));
      const idx = arr.findIndex((_, i) =>
        i + labelBytes.length <= arr.length &&
        arr.slice(i, i + labelBytes.length).every((v, j) => v === labelBytes[j]),
      );
      expect(idx).toBeGreaterThan(0);
      // The bytes immediately before the label are the preceding line's LF
      // (0x0a) — never a GS ! (0x1d 0x21) double-size command.
      expect(arr[idx - 1]).toBe(0x0a);
    }

    // Ends with feed + cut: tail (6 bytes) = [ESC d 5 GS V 65].
    const end = arr.slice(-6);
    expect(end[0]).toBe(0x1b); // ESC
    expect(end[1]).toBe(0x64); // d
    expect(end[3]).toBe(0x1d); // GS
    expect(end[4]).toBe(0x56); // V
    expect(end[5]).toBe(0x41); // 65
  });

  it("renderReceipt emits init at start and feed+cut at end", () => {
    const data = renderReceipt("Halo\nDunia", { paperWidth: 80, density: 2 });
    const arr = Array.from(data);
    expect(arr.slice(0, 2)).toEqual([0x1b, 0x40]);
    // tail (6 bytes) = [ESC d 5 GS V 65]; slice(-5) drops the leading ESC d
    // → [d(100), 5, GS(29), V(86), 65]
    const tail = arr.slice(-5);
    expect(tail[0]).toBe(0x64); // 'd' (0x64)
    expect(tail[1]).toBe(5);
    expect(tail[2]).toBe(0x1d); // GS
    expect(tail[3]).toBe(0x56); // V
    expect(tail[4]).toBe(0x41); // 65
  });

  it("renderReceipt renders @@-prefixed lines as large bold (double-height)", () => {
    const text = [
      "",
      "ZAKY STORE",
      "No Nota: TRX-1",
      "",
      "               KODE TOKEN               ",
      "",
      "@@         1234-5678-9012-3456         ",
      "TOTAL  Rp 52.000",
    ].join("\n");
    const data = renderReceipt(text, { paperWidth: 58 });
    const arr = Array.from(data);
    // The token code line should be preceded by GS ! 0x20 (double-height)
    // and ESC E 1 (bold on), and the "@@" marker must not be printed.
    const tokenBytes = Array.from(textBytes("1234-5678-9012-3456"));
    const idx = arr.findIndex((_, i) =>
      i + tokenBytes.length <= arr.length &&
      arr.slice(i, i + tokenBytes.length).every((v, j) => v === tokenBytes[j]),
    );
    expect(idx).toBeGreaterThan(0);
    // double-height GS ! 0x20 present before the token bytes.
    const dblSeq = [0x1d, 0x21, 0x20];
    const dblIdx = arr.findIndex((_, i) =>
      i + dblSeq.length <= arr.length &&
      arr.slice(i, i + dblSeq.length).every((v, j) => v === dblSeq[j]),
    );
    expect(dblIdx).toBeGreaterThan(0);
    expect(dblIdx).toBeLessThan(idx);
    // Bold on (ESC E 1) present before the token bytes.
    const boldSeq = [0x1b, 0x45, 0x01];
    const boldIdx = arr.findIndex((_, i) =>
      i + boldSeq.length <= arr.length &&
      arr.slice(i, i + boldSeq.length).every((v, j) => v === boldSeq[j]),
    );
    expect(boldIdx).toBeGreaterThan(0);
    expect(boldIdx).toBeLessThan(idx);
    // The "KODE TOKEN" title line (fixed position, normal size) prints at
    // regular height — no GS ! double-height before its first byte.
    const titleBytes = Array.from(textBytes("KODE TOKEN"));
    const titleIdx = arr.findIndex((_, i) =>
      i + titleBytes.length <= arr.length &&
      arr.slice(i, i + titleBytes.length).every((v, j) => v === titleBytes[j]),
    );
    expect(titleIdx).toBeGreaterThan(0);
    const between = arr.slice(titleIdx + titleBytes.length, idx);
    // Nothing printed between the title and the token code except the
    // double-height command and bold on — so no "@@" (0x40 0x40) is present.
    expect(between).not.toContain(0x40);
  });

  it("renderTestPage builds a complete stream", () => {
    const data = renderTestPage("XP-58", { paperWidth: 58 });
    expect(data.length).toBeGreaterThan(50);
    expect(Array.from(data.slice(0, 2))).toEqual([0x1b, 0x40]);
    const arr = Array.from(data);
    // tail (6 bytes) = [ESC d 5 GS V 65]; slice(-5) = [d, 5, GS, V, 65]
    expect(arr.slice(-5)[2]).toBe(0x1d);
    expect(arr.slice(-5)[3]).toBe(0x56);
    expect(arr.slice(-5)[4]).toBe(0x41);
  });
});
