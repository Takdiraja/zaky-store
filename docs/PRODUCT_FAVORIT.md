# PRODUCT_FAVORIT.md

# Product Favorites & Best Selling Products Plan

**Feature Name:** Product Favorites & Best Selling Products
**Module:** Cashier (POS)
**Version:** 1.0
**Status:** Approved for MVP
**Last Updated:** July 2026

---

# 1. Overview

Fitur Product Favorites & Best Selling Products bertujuan mempercepat proses transaksi dengan menampilkan produk yang paling sering dijual atau ditandai sebagai favorit oleh pemilik warung.

Fitur ini dirancang untuk mengurangi aktivitas:

* Scroll produk.
* Search produk.
* Scan barcode untuk produk yang sering dibeli.

Dengan menampilkan produk yang paling sering digunakan pada area paling mudah dijangkau oleh pengguna.

---

# 2. Goals

## Business Goals

* Mempercepat proses transaksi.
* Meningkatkan efisiensi operasional kasir.
* Mengurangi waktu pencarian produk.
* Mengurangi jumlah klik saat transaksi.

---

## User Goals

* Produk yang sering dijual mudah ditemukan.
* Tidak perlu melakukan pencarian berulang.
* Produk favorit selalu tersedia di halaman kasir.

---

# 3. Scope

## Included

### Manual Favorite Product

Pemilik warung dapat menandai produk sebagai favorit.

### Automatic Best Selling Product

Sistem menghitung produk terlaris berdasarkan histori transaksi.

### Favorite Product Section

Area khusus pada halaman kasir.

---

## Excluded

### AI Recommendation

### Seasonal Product Recommendation

### Predictive Product Ranking

---

# 4. Business Problem

Saat warung memiliki:

```text
100+ produk
```

kasir sering menjual produk yang sama berulang kali.

Contoh:

```text
Indomie
Telur
Kopi Sachet
Gula
Minyak Goreng
Air Mineral
```

Namun kasir tetap harus:

```text
Cari Produk
↓
Klik Produk
```

berulang kali.

Hal ini memperlambat transaksi.

---

# 5. Solution

Tambahkan area:

```text
🔥 Produk Favorit
```

pada halaman kasir.

Produk yang ditampilkan berasal dari:

1. Produk Favorit (Manual)
2. Produk Terlaris (Otomatis)

---

# 6. Database Changes

## Collection: products

Tambahkan field:

```json
{
  "is_favorite": false
}
```

---

## Example

```json
{
  "id": "abc123",
  "name": "Indomie Goreng",
  "is_favorite": true
}
```

---

# 7. Product Ranking Source

## Priority Order

### Level 1

Produk Favorit Manual

```text
is_favorite = true
```

---

### Level 2

Produk Terlaris

Dihitung dari histori transaksi.

---

### Level 3

Produk Lainnya

---

# 8. Favorite Product Management

## Product Menu

Tambahkan action:

```text
⭐ Tandai Favorit
```

---

## Behavior

### Not Favorite

```text
☆ Favorit
```

---

### Favorite

```text
⭐ Favorit
```

---

## Rules

Jumlah favorit maksimal:

```text
20 produk
```

untuk menjaga tampilan tetap sederhana.

---

# 9. Best Selling Product Calculation

## Overview

Sistem menghitung produk terlaris berdasarkan jumlah item yang terjual.

---

## Example

### Transaction A

```text
Indomie x 5
```

---

### Transaction B

```text
Indomie x 2
```

---

### Transaction C

```text
Telur x 4
```

---

## Result

```text
Indomie = 7
Telur = 4
```

---

# 10. Collection: product_stats

## Purpose

Menghindari query berat ke collection transactions.

---

## Schema

```json
{
  "product_id": "abc123",
  "total_qty_sold": 145,
  "total_transactions": 89,
  "last_sold_at": "timestamp"
}
```

---

# 11. Update Strategy

Saat transaksi berhasil:

```text
Save Transaction
↓
Update Product Stats
↓
Update Dashboard Aggregate
```

---

## Example

```text
Indomie qty = 2
```

maka:

```json
{
  "total_qty_sold": 102
}
```

menjadi:

```json
{
  "total_qty_sold": 104
}
```

---

# 12. Cashier UI

## Placement

Posisi:

```text
Search Bar
↓
🔥 Produk Favorit
↓
Semua Produk
```

---

## Example

```text
Cari Produk...

🔥 Produk Favorit

[Indomie]
[Telur]
[Kopi]
[Gula]
[Minyak]

----------------

Semua Produk
```

---

# 13. Product Card Design

## Information

Tampilkan:

```text
Nama Produk
Harga Jual
Stock
```

---

## Example

```text
┌──────────────┐
│ Indomie      │
│ Rp3.500      │
│ Stok: 25     │
└──────────────┘
```

---

# 14. Add To Cart Behavior

Ketika produk favorit ditekan:

```text
Klik Produk
↓
Masuk Keranjang
```

tanpa popup tambahan.

---

# 15. Empty State

Jika belum ada favorit:

```text
Belum ada produk favorit.

Tandai produk favorit dari menu Produk.
```

---

# 16. Automatic Best Selling Section

## Overview

Jika jumlah produk favorit kurang dari batas tampilan.

Contoh:

```text
Favorit = 3
```

Maka sistem dapat mengisi slot kosong menggunakan produk terlaris.

---

## Example

```text
🔥 Produk Favorit

⭐ Indomie
⭐ Telur
⭐ Kopi

📈 Produk Terlaris

Minyak
Gula
Air Mineral
```

---

# 17. Refresh Strategy

## Favorite Products

Realtime dari collection products.

---

## Best Selling Products

Update:

```text
Setelah transaksi berhasil
```

Tidak perlu realtime setiap detik.

---

# 18. Performance Requirements

## Load Time

Target:

```text
< 200 ms
```

untuk menampilkan daftar favorit.

---

## Query Size

Maksimal:

```text
20 produk
```

---

# 19. Mobile UX Requirements

## Touch Area

Minimum:

```text
48 x 48 px
```

---

## Grid Layout

### Mobile

```text
2 kolom
```

---

### Tablet

```text
3-4 kolom
```

---

# 20. Future Enhancement

## Phase 2

Tambahkan:

```text
📈 Produk Terlaris Hari Ini
```

---

## Phase 3

Tambahkan:

```text
📈 Produk Terlaris Minggu Ini
📈 Produk Terlaris Bulan Ini
```

---

## Phase 4

Tambahkan:

```text
🔥 Frequently Bought Together
```

Contoh:

```text
Indomie
+
Telur
```

---

# 21. Acceptance Criteria

## Favorite Product

✅ Produk dapat ditandai favorit

✅ Produk dapat dihapus dari favorit

✅ Produk favorit tampil di kasir

✅ Produk favorit dapat langsung masuk keranjang

---

## Best Selling Product

✅ Sistem menghitung total penjualan produk

✅ Produk terlaris dapat ditampilkan

✅ Ranking diperbarui setelah transaksi

---

## Performance

✅ Load favorit < 200 ms

✅ Maksimal 20 produk favorit

---

# Final Recommendation

Untuk MVP Warung Resoyudan, implementasikan kombinasi:

```text
⭐ Produk Favorit (Manual)
+
📈 Produk Terlaris (Otomatis)
```

dengan prioritas utama pada **Produk Favorit Manual**, karena lebih mudah dipahami oleh pengguna awam dan memberikan dampak langsung terhadap kecepatan transaksi. Produk Terlaris berfungsi sebagai pelengkap untuk membantu pengguna menemukan produk yang paling sering dijual tanpa perlu melakukan konfigurasi tambahan.
