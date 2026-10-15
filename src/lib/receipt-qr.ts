/**
 * Receipt QR payload — encodes only the transaction identifier so the QR
 * can be scanned to locate the transaction. No customer or financial data.
 */

export interface ReceiptQrPayload {
  type: "receipt";
  transactionId: string;
}

/** Builds the QR payload string for a receipt number. */
export function buildReceiptQrPayload(receiptNumber: string): string {
  return JSON.stringify({
    type: "receipt",
    transactionId: receiptNumber,
  } satisfies ReceiptQrPayload);
}

/**
 * Parses a scanned QR payload back to a transaction id.
 * Accepts:
 *  - the structured JSON payload: {"type":"receipt","transactionId":"TRX-..."}
 *  - a bare receipt-number string (forward/backward compat)
 * Returns null for anything unrecognizable.
 */
export function parseReceiptQrPayload(payload: string): { transactionId: string } | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;

  // Structured JSON form.
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<ReceiptQrPayload> | string;
      if (typeof parsed === "string") {
        return { transactionId: parsed };
      }
      if (parsed && parsed.type === "receipt" && typeof parsed.transactionId === "string") {
        return { transactionId: parsed.transactionId };
      }
      return null;
    } catch {
      return null;
    }
  }

  // Bare receipt-number fallback (e.g. "TRX-20260805-002" or a
  // digital-service number "DSV-20260814-001").
  if (
    /^TRX-\d{8}-\d{3,}$/.test(trimmed) ||
    /^DSV-\d{8}-\d{3,}$/.test(trimmed)
  ) {
    return { transactionId: trimmed };
  }

  return null;
}
