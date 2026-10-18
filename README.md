# Warung Resoyudan

Aplikasi Point of Sale (POS) untuk warung kelontong — responsive mobile & tablet, dengan fitur manajemen produk, transaksi kasir, kasbon pelanggan, laporan usaha, dan scan barcode.

## Fitur

- **Kasir** — Grid produk, tambah ke keranjang, animasi bola keranjang, pilih metode bayar (Tunai / Kasbon / QRIS), konfirmasi transaksi
- **Scan Barcode** — Scan produk via kamera, continuous scanning, otomatis tambah ke keranjang (kasir) atau isi form produk (manajemen produk)
- **Manajemen Produk** — Tambah manual / scan barcode, edit, hapus, cari, filter kategori, stok menipis, nilai inventaris
- **Kasbon** — Daftar pelanggan, riwayat transaksi, bayar cicilan, overdue tracking
- **Dashboard** — Ringkasan penjualan, profit, stok menipis, utang aktif, grafik 7 hari
- **Laporan** — Filter periode (hari/minggu/bulan/kustom), grafik batang, donat profit, produk terlaris, export PDF
- **Sidebar Navigation** — Akses semua menu via drawer

## Tech Stack

- **Framework:** Next.js 16 (Turbopack)
- **UI:** Tailwind CSS 4, shadcn/ui, Lucide React
- **State:** Zustand
- **Scanner:** html5-qrcode
- **PDF:** jsPDF + jsPDF-AutoTable

## Cara Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di browser. Untuk scan barcode, izinkan akses kamera.

## Struktur

```
src/
├── app/(main)/          # Halaman: kasir (/), dashboard, produk, kasbon, laporan
├── components/
│   ├── kasir/           # POS: grid, card, cart, payment, scanner, animasi
│   ├── produk/          # Product form, table, stock badge
│   ├── kasbon/          # Customer list, debt detail, payment input
│   ├── dashboard/       # Metrics, stock alerts, debt list, chart
│   ├── laporan/         # Charts, top products, export PDF
│   ├── layout/          # App bar, sidebar drawer
│   └── shared/          # Toast, confirm dialog, empty state, scanner
├── stores/              # Zustand stores (product, cart, transaction, dll)
├── data/mock/           # Data dummy
└── types/               # TypeScript interfaces
```
