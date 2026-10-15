export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  barcode: string | null;
  image_url: string | null;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  is_favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PRODUCT_CATEGORIES = [
  "Makanan",
  "Minuman",
  "Sembako",
  "Kebutuhan Rumah",
] as const;

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  subtotal: number;
  profit: number;
}

export type PaymentMethod = "cash" | "kasbon" | "qris";
export type TransactionStatus = "paid" | "debt";
export type PaperWidth = 58 | 80;

/**
 * Payment method used on a digital service transaction. Reuses the POS
 * methods but narrows to the ones that make sense for a service purchase
 * (physical cash or QRIS; kasbon is intentionally excluded).
 */
export type DigitalServicePayment = "cash" | "qris";

/**
 * Digital Services — a record of a service-based transaction (BPJS, PDAM,
 * pulsa, PLN, e-wallet, transfer, ...). It does NOT touch product stock.
 */
export interface DigitalServiceTransaction {
  id: string;
  /** Unique daily-sequential number, e.g. DSV-YYYYMMDD-XXX */
  transactionNumber: string;
  /** Service type id from the DIGITAL_SERVICES catalog, e.g. "pulsa". */
  serviceType: string;
  /** e.g. phone number, customer ID, meter number, biller reference. */
  customerIdentifier: string;
  /** Display name of the sub-option chosen (e.g. a game for game_topup). */
  subService?: string | null;
  /** PLN prepaid token code (for pln_prepaid transactions). */
  tokenCode?: string | null;
  customerName: string | null;
  /** Face value of the service (before the service fee). */
  nominalAmount: number;
  /** Extra fee charged by the warung (service fee). */
  serviceFee: number;
  /** nominalAmount + serviceFee. */
  totalAmount: number;
  paymentMethod: DigitalServicePayment;
  /** YYYY-MM-DD (local time), consistent with the rest of the app. */
  transactionDate: string;
  /** Free-form notes entered by the operator. */
  notes: string | null;
  /** Number printed on the receipt. */
  receiptNumber: string | null;
  /** Print status — receipt still printable even if not printed. */
  printed: boolean;
  /** Number of times the receipt has been printed (for repeat prints). */
  printCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  customerId: string | null;
  createdAt: string;
  receiptNumber: string | null;
  amountPaid: number;
  change: number;
  notes?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  currentDebt: number;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  notes: string;
}

export interface Expense {
  id: string;
  expenseNumber: string; // EXP-YYYYMMDD-XXX
  expenseDate: string; // ISO (YYYY-MM-DD)
  title: string;
  description: string;
  totalAmount: number;
  receiptImage: string | null; // base64 data-URL
  createdAt: string;
  updatedAt: string;
}

export type CapitalType = "initial" | "addition" | "withdrawal";

/**
 * Which business stream a capital entry belongs to.
 * - "warung": capital for physical goods (offset against goods profit).
 * - "digital_service": capital for the digital-services business line
 *   (offset against digital-service profit / service fees).
 * Missing/legacy records default to "warung".
 */
export type CapitalCategory = "warung" | "digital_service";

export interface CapitalTransaction {
  id: string;
  capitalNumber: string; // CAP-YYYYMMDD-XXX
  transactionDate: string; // ISO (YYYY-MM-DD)
  type: CapitalType;
  category: CapitalCategory;
  amount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReport {
  date: string;
  totalSales: number;
  totalProfit: number;
  totalCash: number;
  totalKasbon: number;
  transactionCount: number;
}

export type PeriodFilter = "today" | "yesterday" | "week" | "month" | "custom";
