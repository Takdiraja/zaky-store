export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  barcode: string | null;
  // Barcode tambahan (alias): satu produk bisa dikenali dari beberapa barcode
  // berbeda (mis. kemasan lama/baru, varian isi). Opsional & backward-compatible.
  barcodes?: string[];
  /**
   * Satuan kemasan (dus/pack/karton): tiap kemasan punya barcode sendiri
   * (opsional), isi per kemasan dalam satuan dasar, dan harga beli per kemasan.
   * Dipakai di Barang Masuk: scan barcode kardus → stok nambah otomatis.
   */
  units?: ProductUnit[];
  image_url: string | null;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  is_favorite?: boolean;
  /**
   * Kalau false, penjualan tidak cek stok (untuk produk auto-daftar dari
   * seed barcode yang stoknya belum diopname). Default true.
   */
  trackStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Satuan kemasan produk: 1 dus = 12 pcs, dst. */
export interface ProductUnit {
  id: string;
  /** Nama kemasan: "Dus", "Pack", "Karton", ... */
  name: string;
  /** Barcode yang tertera di kemasan (opsional — boleh kosong). */
  barcode: string | null;
  /** Isi per kemasan dalam satuan dasar (pcs). Harus > 0. */
  contains: number;
  /** Harga beli per kemasan (opsional, untuk referensi). */
  buyPrice: number | null;
}

/** Satu baris item dalam nota barang masuk. */
export interface StockInItem {
  id: string;
  productId: string;
  productName: string;
  /** ID kemasan dari Product.units; null = satuan dasar (pcs). */
  unitId: string | null;
  unitName: string;
  /** Jumlah kemasan (bisa desimal? tidak — integer). */
  qty: number;
  /** Isi per kemasan saat nota dibuat (snapshot, anti berubah). */
  contains: number;
  /** Harga beli per kemasan. */
  buyPricePerUnit: number;
  /** qty * buyPricePerUnit */
  subtotal: number;
  /** qty * contains — penambahan stok dalam satuan dasar. */
  stockAdded: number;
}

/** Nota barang masuk (belanja grosir). */
export interface StockInReceipt {
  id: string;
  receiptNumber: string; // BM-YYYYMMDD-XXX
  receiptDate: string; // ISO (YYYY-MM-DD)
  supplier: string | null;
  items: StockInItem[];
  /** Total seluruh item — tercatat sekali sebagai modal "Belanja Stok". */
  totalAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const PRODUCT_CATEGORIES = [
  "Sembako",
  "Snack & Jajan",
  "Minuman",
  "Perawatan Diri",
  "Kebersihan Rumah",
  "Bumbu Dapur",
  "Rokok",
  "Lainnya",
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

export type CapitalType = "initial" | "addition" | "withdrawal" | "stock_purchase";

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
