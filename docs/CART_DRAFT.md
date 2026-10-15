# CART_DRAFT.md

# Transaction Draft Management Plan

**Feature Name:** Transaction Draft Management (Draft Transaksi)
**Module:** Cashier (POS)
**Version:** 2.0
**Status:** Approved for MVP
**Last Updated:** July 2026

---

# 1. Overview

Fitur **Draft Transaksi** memungkinkan pengguna menyimpan transaksi yang belum selesai untuk dilanjutkan di kemudian waktu tanpa kehilangan data keranjang.

Fitur ini dirancang untuk menangani kondisi yang sangat umum terjadi di warung, seperti:

* Pelanggan masih memilih barang.
* Pelanggan lupa membawa uang.
* Pelanggan ingin melanjutkan belanja nanti.
* Kasir perlu melayani pelanggan lain terlebih dahulu.
* Terjadi antrean saat transaksi berlangsung.

Dengan fitur ini, pengguna dapat menyimpan keranjang sebagai Draft dan melanjutkannya kapan saja.

---

# 2. Goals

## Business Goals

* Mempercepat pelayanan saat antrean ramai.
* Mengurangi kehilangan transaksi potensial.
* Meningkatkan fleksibilitas proses penjualan.
* Menyediakan pengalaman POS yang lebih profesional.

---

## User Goals

* Menyimpan transaksi sementara.
* Melanjutkan transaksi kapan saja.
* Berpindah pelanggan tanpa kehilangan data keranjang.
* Mengelola beberapa transaksi yang belum selesai.

---

# 3. Business Problem

Kasus yang sering terjadi:

### Pelanggan Belum Selesai Memilih

```text
Pelanggan A
↓
Sudah memilih 10 produk
↓
Masih ingin melihat barang lain
↓
Pelanggan B datang
```

Tanpa draft:

```text
Kasir harus menunggu
```

atau

```text
Keranjang dihapus
```

---

### Pelanggan Belum Bisa Membayar

```text
Total Rp150.000
↓
Pelanggan mengambil uang terlebih dahulu
↓
Akan kembali nanti
```

Kasir perlu menyimpan transaksi sementara.

---

### Antrean Ramai

```text
Pelanggan A
↓
Belum selesai
↓
Simpan Draft
↓
Layani Pelanggan B
↓
Layani Pelanggan C
↓
Kembali ke Pelanggan A
```

---

# 4. Solution

Tambahkan fitur:

```text
Simpan Sebagai Draft
```

pada halaman Kasir.

Draft yang tersimpan dapat diakses melalui tombol:

```text
Draft
```

di Navbar Kasir.

---

# 5. Scope

## Included

### Save Draft

### Load Draft

### Delete Draft

### Search Draft

### Convert Draft To Transaction

### Offline Support

---

## Excluded

### Multi Device Collaboration

### Draft Sharing

### Draft Approval Workflow

---

# 6. Architecture

## Collection

Buat collection baru:

```text
transaction_drafts
```

Draft tidak boleh disimpan pada collection:

```text
transactions
```

karena transaksi belum benar-benar terjadi.

---

# 7. Database Schema

## transaction_drafts

```json
{
  "id": "auto-generated",

  "draft_number": "DRF-20260720-001",

  "items": [
    {
      "product_id": "abc123",
      "name": "Indomie Goreng",
      "quantity": 2,
      "sell_price": 3500,
      "subtotal": 7000
    }
  ],

  "customer_name": "",

  "payment_method": "cash",

  "total_amount": 7000,

  "draft_name": "",

  "created_at": "timestamp",

  "updated_at": "timestamp"
}
```

---

# 8. Draft Number Format

Format:

```text
DRF-YYYYMMDD-XXX
```

Contoh:

```text
DRF-20260720-001
DRF-20260720-002
DRF-20260720-003
```

---

# 9. Cashier UI

## Navbar

Tambahkan tombol:

```text
📝 Draft
```

---

## Position

```text
┌───────────────────────┐
│ ☰ Kasir       📝 Draft │
└───────────────────────┘
```

---

# 10. Save Draft Flow

## User Flow

```text
Tambah Produk
↓
Keranjang
↓
Klik Simpan Draft
↓
Input Nama Draft (Opsional)
↓
Simpan
```

---

## Example

```text
Nama Draft

[Pelanggan Pak Joko]
```

---

Jika kosong:

```text
Draft otomatis menggunakan nomor draft.
```

---

# 11. Draft Dialog

## Input

```text
┌──────────────────────┐
│ Simpan Draft         │
├──────────────────────┤
│ Nama Draft (Opsional)│
│ [..................] │
├──────────────────────┤
│ Batal                │
│ Simpan               │
└──────────────────────┘
```

---

# 12. Draft List

## Access

```text
Navbar
↓
Draft
```

---

## Open

Gunakan:

```text
Full Screen Dialog
```

agar nyaman digunakan pada mobile.

---

# 13. Draft List UI

```text
Draft Transaksi

--------------------------------

Pak Joko

DRF-20260720-001

3 Produk

Rp25.000

10:35

--------------------------------

Draft #2

DRF-20260720-002

5 Produk

Rp75.000

11:10
```

---

# 14. Search Draft

Tambahkan pencarian:

```text
Cari Draft...
```

---

## Search By

* Nama Draft
* Nomor Draft
* Nama Pelanggan

---

# 15. Draft Actions

Setiap Draft memiliki:

```text
[ Lanjutkan ]

[ Hapus ]
```

---

# 16. Continue Draft Flow

```text
Pilih Draft
↓
Klik Lanjutkan
↓
Load Keranjang
↓
Tutup Dialog Draft
↓
Lanjut Transaksi
```

---

# 17. Draft Replacement Rule

Jika keranjang saat ini masih berisi item:

```text
Keranjang Tidak Kosong
↓
Buka Draft
```

maka tampilkan konfirmasi:

```text
Keranjang saat ini akan diganti.

Lanjutkan?
```

---

# 18. Delete Draft Flow

```text
Klik Hapus
↓
Konfirmasi
↓
Delete Draft
```

---

## Confirmation

```text
Yakin ingin menghapus draft ini?
```

---

# 19. Checkout Flow

Ketika draft berhasil diproses menjadi transaksi:

```text
Draft
↓
Checkout
↓
Create Transaction
↓
Update Stock
↓
Delete Draft
```

---

# 20. Offline Support

## Strategy

Gunakan:

```text
Firestore Offline Persistence
```

untuk seluruh operasi Draft.

---

## Why

Dengan Firestore Offline Persistence:

```text
Save Draft
↓
Firestore Local Cache
↓
Auto Sync
```

berjalan otomatis.

---

## Benefits

Tidak perlu:

```text
localStorage
IndexedDB
Custom Queue
```

untuk fitur Draft.

---

# 21. Recovery Draft (Background Feature)

Selain Draft Transaksi, sistem tetap memiliki:

```text
Automatic Cart Recovery
```

yang berbeda dengan Draft Transaksi.

---

## Purpose

Melindungi pengguna dari:

```text
Refresh Browser
Crash Browser
Tab Tertutup
```

---

## Storage

```text
localStorage
```

---

## Flow

```text
Refresh
↓
Draft Recovery
↓
Restore Keranjang
```

---

## Important

Recovery Draft:

```text
Tidak tampil di daftar Draft.
```

karena hanya digunakan untuk pemulihan otomatis.

---

# 22. Auto Cleanup

Draft yang tidak digunakan selama:

```text
30 Hari
```

akan ditandai sebagai:

```text
Expired
```

---

## Future Job

Scheduled Cleanup:

```text
Delete Expired Draft
```

---

# 23. Performance Requirements

## Save Draft

Target:

```text
< 1 detik
```

---

## Load Draft List

Target:

```text
< 500 ms
```

---

## Load Draft To Cart

Target:

```text
< 300 ms
```

---

# 24. Mobile UX Requirements

## Full Screen Dialog

Wajib menggunakan:

```text
Full Screen Dialog
```

karena daftar draft dapat bertambah banyak.

---

## Touch Area

Minimum:

```text
48 x 48 px
```

---

## One-Hand Friendly

Tombol:

```text
Lanjutkan
Hapus
```

mudah dijangkau pada layar HP.

---

# 25. Edge Cases

## Product Deleted

Kasus:

```text
Draft Berisi Produk A
↓
Produk A Dihapus
↓
Load Draft
```

---

Behavior:

```text
Skip Produk
↓
Tampilkan Informasi
```

Toast:

```text
1 produk tidak lagi tersedia dan tidak dimuat ke keranjang.
```

---

## Product Price Changed

Kasus:

```text
Draft Lama
↓
Harga Produk Berubah
↓
Lanjutkan Draft
```

---

Behavior:

Gunakan harga terbaru dari produk.

---

Toast:

```text
Beberapa harga produk telah diperbarui.
```

---

# 26. Acceptance Criteria

## Save Draft

✅ Keranjang dapat disimpan sebagai Draft

✅ Draft tersimpan saat online maupun offline

---

## Draft List

✅ Draft dapat dilihat melalui Navbar Kasir

✅ Draft dapat dicari

✅ Draft dapat dihapus

---

## Continue Draft

✅ Draft dapat dimuat kembali ke keranjang

✅ Draft dapat diproses menjadi transaksi

---

## Offline

✅ Draft tetap berfungsi saat internet terputus

✅ Sinkronisasi otomatis saat koneksi kembali

---

# 27. Future Enhancement

## Phase 2

Tambahkan:

```text
Duplicate Draft
```

---

## Phase 3

Tambahkan:

```text
Draft Tag
```

Contoh:

```text
Pelanggan
Pesanan Antar
Titipan
```

---

## Phase 4

Tambahkan:

```text
Draft Priority
```

dan

```text
Recently Opened Draft
```

---

# Final Recommendation

Untuk MVP Warung Resoyudan, implementasikan dua mekanisme berbeda:

### 1. Transaction Draft (Visible)

```text
Firestore
↓
Navbar Draft
↓
Full Screen Dialog
↓
Lanjutkan Transaksi
```

Digunakan untuk menyimpan transaksi yang memang sengaja ditunda.

---

### 2. Cart Recovery (Invisible)

```text
localStorage
↓
Auto Restore
```

Digunakan untuk melindungi pengguna dari refresh, crash, atau tab yang tertutup secara tidak sengaja.

Kombinasi keduanya memberikan pengalaman yang lebih dekat dengan aplikasi POS profesional sekaligus tetap sederhana untuk pengguna warung.
