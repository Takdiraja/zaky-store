import type { CartItem, PaymentMethod, PaperWidth } from "@/types";
import { buildReceiptText } from "./receipt";

export interface WhatsAppPayload {
  phone: string;
  receiptText: string;
}

/**
 * Formats phone number to international format with +62 prefix.
 * - 08123456789 → +628123456789
 * - 628123456789 → +628123456789
 * - +628123456789 → +628123456789
 */
export function formatPhoneToInternational(phone: string): string {
  const cleaned = phone.replace(/[\s\-]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("62")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+62${cleaned.slice(1)}`;
  return `+62${cleaned}`;
}

/**
 * Validates WhatsApp phone number.
 * Must be a valid format after conversion.
 */
export function isValidPhone(phone: string): boolean {
  const international = formatPhoneToInternational(phone);
  // Must be +62 followed by 9-13 digits
  return /^\+62\d{9,13}$/.test(international);
}

/**
 * Opens WhatsApp with pre-filled receipt message.
 */
export function sendWhatsAppReceipt(
  phone: string,
  params: {
    items: CartItem[];
    totalAmount: number;
    amountPaid: number;
    change: number;
    paymentMethod: PaymentMethod;
    receiptNumber: string;
    date: string;
    customerName?: string;
    paperWidth?: PaperWidth;
  },
): void {
  const receiptText = buildReceiptText({
    ...params,
    paperWidth: params.paperWidth ?? 58,
    mode: "whatsapp",
  });

  const url = `https://wa.me/${formatPhoneToInternational(phone)}?text=${encodeURIComponent(receiptText)}`;
  window.open(url, "_blank");
}
