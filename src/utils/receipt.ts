import {
  buildReceiptText as buildFormattedReceipt,
  LINE_58,
  LINE_80,
  lineWidth,
  type ReceiptParams,
} from "@/lib/receipt-formatter";

/**
 * Backward-compatible shim. The receipt layout engine now lives in
 * `src/lib/receipt-formatter.ts`; this re-exports the same entry point so
 * existing callers keep working unchanged.
 */
export { LINE_58, LINE_80, lineWidth };
export type { ReceiptParams } from "@/lib/receipt-formatter";

export function buildReceiptText(params: ReceiptParams): string {
  return buildFormattedReceipt(params);
}
