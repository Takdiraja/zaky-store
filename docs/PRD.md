Berikut beberapa hal yang menurut saya perlu ditambahkan sebelum dokumen dianggap **production-ready**:

1. **Kasbon sebaiknya menjadi entitas terpisah**, bukan hanya field di `transactions`. Jika tidak, pelunasan sebagian, histori pembayaran, dan pelacakan saldo hutang akan sulit dilakukan.
2. **Firestore transaction/batch write** perlu menjadi persyaratan teknis agar stok tidak menjadi negatif saat dua transaksi terjadi bersamaan.
3. **Audit log sederhana** penting meskipun tanpa autentikasi, agar perubahan stok dan penghapusan transaksi dapat ditelusuri.
4. **Backup & export data** perlu menjadi fitur wajib karena target pengguna UMKM sangat rentan kehilangan data.
5. **PWA (Progressive Web App)** lebih cocok dibanding web biasa karena dapat dipasang seperti aplikasi Android tanpa masuk Play Store.
6. **Metrik bisnis** perlu diperjelas agar KPI dapat diukur setelah aplikasi digunakan.

Berikut versi PRD yang sudah diperluas dan lebih siap digunakan sebagai acuan pengembangan.

# PRD.md

# Product Requirement Document (PRD)

## Warung Resoyudan

**Version:** 1.0
**Status:** Production Ready
**Last Updated:** July 2026

Website Theme
Primary: #0F172A
Secondary: #2563EB
Tertiary: #231500
Neutral: #787778

---

# 1. Product Overview

## 1.1 Product Name

Warung Resoyudan

## 1.2 Product Vision

Membantu pemilik warung melakukan pencatatan penjualan, pengelolaan stok, kasbon pelanggan, dan pembukuan sederhana secara cepat tanpa memerlukan pengetahuan akuntansi maupun teknologi yang kompleks.

## 1.3 Product Goals

### Business Goals

* Mengurangi pencampuran uang pribadi dan usaha.
* Menyediakan histori transaksi yang dapat digunakan sebagai dokumen pendukung pengajuan KUR atau modal usaha.
* Mengurangi kehilangan potensi penjualan akibat stok habis.
* Mengelola kasbon pelanggan secara terstruktur.

### User Goals

* Mencatat transaksi dalam waktu kurang dari 3 menit.
* Mengetahui kondisi keuangan harian secara instan.
* Mengetahui stok barang yang perlu dibeli ulang.
* Mengetahui siapa saja pelanggan yang masih memiliki hutang.

---

# 2. Success Metrics (KPI)

| KPI                           | Target    |
| ----------------------------- | --------- |
| Waktu penyelesaian transaksi  | < 3 menit |
| Waktu proses simpan transaksi | < 1 detik |
| Waktu load dashboard          | < 2 detik |
| Akurasi stok                  | ≥ 99%     |
| Crash/Error Rate              | < 1%      |
| Ketersediaan aplikasi         | ≥ 99%     |

---

# 3. Target Users

## Primary User

Pemilik warung kecil atau toko kelontong.

Karakteristik:

* Tidak terbiasa menggunakan software bisnis kompleks.
* Menggunakan smartphone Android sebagai perangkat utama.
* Membutuhkan pencatatan sederhana dan cepat.
* Memiliki pelanggan kasbon tetap.

---

# 4. Scope MVP

## Included

### Kasir

* Penjualan tunai
* Penjualan kasbon
* Keranjang transaksi
* Pencarian produk
* Pengurangan stok otomatis

### Dashboard

* Ringkasan penjualan
* Estimasi keuntungan
* Kasbon aktif
* Stok menipis

### Produk

* Tambah produk
* Edit produk
* Hapus produk
* Update stok cepat

### Laporan

* Laporan harian
* Mingguan
* Bulanan
* Export PDF

### Kasbon

* Daftar hutang pelanggan
* Pelunasan hutang
* Riwayat pembayaran

---

## Excluded (Future Release)

* Multi-user
* Multi-cabang
* Barcode scanner
* Supplier management
* Pembelian stok dari supplier
* Akuntansi lengkap
* Integrasi printer thermal
* Integrasi WhatsApp
* Integrasi pembayaran digital

---

# 5. System Architecture

## Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI

## Backend

* Next.js API Routes
* Firebase SDK

## Database

Firebase Firestore

## Deployment

* Vercel
* Firebase Cloud Firestore

## Offline Support

Firebase Offline Persistence Enabled

## Application Type

Progressive Web App (PWA)

Fitur:

* Install ke Home Screen
* Offline Cache
* Mobile Experience seperti aplikasi native

---

# 6. Database Design

## Collection: products

```json
{
  "id": "string",
  "name": "string",
  "buy_price": 0,
  "sell_price": 0,
  "stock": 0,
  "min_stock": 0,
  "is_active": true,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## Collection: transactions

```json
{
  "id": "string",
  "date": "timestamp",
  "items": [
    {
      "product_id": "string",
      "name": "string",
      "quantity": 0,
      "buy_price": 0,
      "sell_price": 0,
      "subtotal": 0,
      "profit": 0
    }
  ],
  "total_amount": 0,
  "total_profit": 0,
  "payment_method": "cash | kasbon",
  "status": "paid | debt",
  "customer_id": "string | null",
  "created_at": "timestamp"
}
```

---

## Collection: customers

```json
{
  "id": "string",
  "name": "string",
  "phone": "string",
  "current_debt": 0,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## Collection: debt_payments

```json
{
  "id": "string",
  "customer_id": "string",
  "amount": 0,
  "payment_date": "timestamp",
  "notes": "string"
}
```

---

## Collection: reports

```json
{
  "id": "YYYY-MM-DD",
  "total_sales": 0,
  "total_profit": 0,
  "total_cash": 0,
  "total_kasbon": 0,
  "transaction_count": 0,
  "updated_at": "timestamp"
}
```

---

## Collection: audit_logs

```json
{
  "id": "string",
  "action": "create | update | delete",
  "entity": "product | transaction | debt",
  "entity_id": "string",
  "description": "string",
  "created_at": "timestamp"
}
```

---

# 7. Navigation Structure

```text
Kasir (Default)
├── Dashboard
├── Produk
├── Kasbon
└── Laporan
```

---

# 8. UX Requirements

## General Principles

* Mobile First
* One Hand Operation
* Large Touch Targets
* Minimal Input
* Fast Transaction Flow

---

## Sidebar

Default:

* Collapsed

Behavior:

* Overlay Drawer
* Tidak menggeser layout aktif
* Bisa ditutup dengan tap area luar

---

## Button Size

Minimum:

```text
44 x 44 px
```

Recommended:

```text
48 x 48 px
```

---

# 9. Feature Requirements

# M1. Kasir

## Goal

Transaksi selesai kurang dari 3 menit.

### Components

#### Product List

Menampilkan:

* Nama Produk
* Harga Jual
* Stok Saat Ini

#### Search Product

Pencarian realtime berdasarkan:

* Nama Produk

#### Cart

Menampilkan:

* Nama Barang
* Qty
* Harga
* Subtotal

#### Quantity Controls

* Tombol +
* Tombol -

#### Payment Method

* Cash
* Kasbon

#### Customer Name

Muncul hanya ketika:

```text
Payment Method = Kasbon
```

#### Complete Transaction Button

Posisi:

```text
Sticky Bottom
```

---

## Business Rules

### Cash

```text
Status = Paid
```

### Kasbon

```text
Status = Debt
```

### Stock Validation

```text
Qty tidak boleh melebihi stok tersedia
```

### Transaction Save Process

Menggunakan Firestore Transaction:

1. Validasi stok.
2. Simpan transaksi.
3. Kurangi stok.
4. Update laporan.
5. Commit.

Semua berhasil atau seluruh proses dibatalkan.

---

# M2. Dashboard

## Financial Summary

Hari Ini:

* Total Penjualan
* Total Profit
* Total Kas Masuk
* Total Kasbon

---

## Stock Alerts

Tampilkan:

```text
stock <= min_stock
```

---

## Active Debts

Menampilkan:

* Nama Pelanggan
* Total Hutang
* Tombol Lunasi

---

# M3. Produk

## Product List

Kolom:

* Nama
* Harga Beli
* Harga Jual
* Stok

---

## Add Product

Field:

* Nama Produk
* Harga Beli
* Harga Jual
* Stok Awal
* Minimum Stok

---

## Edit Product

Dapat mengubah:

* Nama
* Harga
* Stok
* Minimum Stok

---

## Quick Stock Update

Aksi:

```text
+ Tambah Stok
```

tanpa membuka form edit.

---

# M4. Kasbon

## Customer List

Menampilkan:

* Nama
* Total Hutang

---

## Debt Detail

Menampilkan:

* Riwayat transaksi hutang
* Riwayat pembayaran

---

## Debt Payment

Input:

* Nominal pembayaran

Output:

* Mengurangi saldo hutang pelanggan

---

# M5. Laporan

## Filters

* Hari Ini
* Minggu Ini
* Bulan Ini
* Custom Range

---

## Sales Metrics

* Omzet
* Profit
* Kas Masuk
* Kasbon
* Jumlah Transaksi

---

## Charts

* Tren Penjualan
* Tren Profit

---

## PDF Export

Isi PDF:

* Ringkasan usaha
* Omzet
* Profit
* Kasbon
* Riwayat transaksi

Format siap cetak A4.

---

# 10. Error Handling

## Stock Habis

Pesan:

```text
Stok tidak mencukupi.
```

---

## Koneksi Terputus

Pesan:

```text
Mode Offline Aktif.
Data akan disinkronkan saat koneksi tersedia.
```

---

## Gagal Menyimpan

Pesan:

```text
Transaksi gagal disimpan.
Silakan coba kembali.
```

---

# 11. Security Requirements

Karena tanpa autentikasi:

## Client Restrictions

* Validasi input wajib.
* Sanitasi seluruh data.

## Database Rules

* Firestore Security Rules.
* Hanya endpoint server yang dapat melakukan write.

## Backup

Backup otomatis:

* Harian
* Retensi 30 hari

---

# 12. Acceptance Criteria

## Kasir

✅ Menambahkan produk ke keranjang

✅ Mengubah kuantitas

✅ Menyimpan transaksi

✅ Mengurangi stok otomatis

✅ Menyimpan kasbon

---

## Dashboard

✅ Menampilkan ringkasan hari ini

✅ Menampilkan stok menipis

✅ Menampilkan kasbon aktif

---

## Produk

✅ CRUD produk berjalan

✅ Update stok cepat berjalan

---

## Kasbon

✅ Pelunasan hutang berjalan

✅ Histori pembayaran tersedia

---

## Laporan

✅ Filter laporan berjalan

✅ PDF berhasil diunduh

---

# 13. Future Enhancements

## Phase 2

* Barcode Scanner
* Thermal Printer
* Multi User
* Multi Device Sync
* Supplier Management

## Phase 3

* WhatsApp Reminder Kasbon
* AI Demand Forecasting
* Automatic Restock Recommendation
* Digital Payment Integration

---

# Final Product Statement

Warung Resoyudan adalah aplikasi kasir dan pembukuan sederhana berbasis web/PWA yang dirancang khusus untuk warung kecil dengan fokus pada kecepatan transaksi, pencatatan kasbon, pengelolaan stok produk jadi, serta penyediaan laporan usaha yang dapat digunakan sebagai dasar pengambilan keputusan bisnis maupun pengajuan KUR.
