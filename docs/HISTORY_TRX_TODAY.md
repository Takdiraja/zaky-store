# HISTORY_TRX_TODAY.md

# Today's Transaction History Plan

**Feature Name:** Today's Transaction History
**Module:** Cashier (POS)
**Version:** 1.0
**Status:** Approved for MVP
**Last Updated:** July 2026

---

# 1. Overview

Fitur **Riwayat Transaksi Hari Ini** bertujuan memberikan akses cepat kepada pemilik warung untuk melihat transaksi yang baru saja terjadi tanpa harus membuka halaman laporan atau melakukan pencarian data transaksi.

Fitur ini dirancang untuk membantu pengguna:

* Memeriksa transaksi yang baru dilakukan.
* Mengatasi kesalahan input transaksi.
* Melakukan cetak ulang nota.
* Mengirim ulang nota WhatsApp.
* Memverifikasi transaksi kasbon.
* Mengurangi kebingungan saat pelanggan mempertanyakan transaksi yang baru terjadi.

---

# 2. Goals

## Business Goals

* Mengurangi kesalahan operasional.
* Mempercepat proses pengecekan transaksi.
* Mengurangi kebutuhan pencarian manual.
* Mempermudah reprint nota.

---

## User Goals

* Melihat transaksi terakhir dengan cepat.
* Memeriksa detail transaksi tanpa membuka menu laporan.
* Melakukan reprint atau kirim ulang nota dengan satu klik.

---

# 3. Business Problem

Kasus yang sering terjadi di warung:

### Salah Input Produk

```text
Kasir menjual:

Indomie Goreng x2

Namun ternyata hanya x1.
```

Setelah transaksi selesai, pengguna perlu menemukan transaksi tersebut dengan cepat.

---

### Pelanggan Kehilangan Nota

```text
"Pak, nota tadi boleh dicetak ulang?"
```

Pengguna harus dapat menemukan transaksi terakhir tanpa membuka laporan.

---

### Pelanggan Komplain

```text
"Tadi saya bayar berapa ya?"
```

Pengguna perlu melihat transaksi yang baru saja terjadi.

---

# 4. Solution

Tambahkan widget:

```text
Riwayat Hari Ini
```

langsung pada halaman Kasir.

Widget menampilkan daftar transaksi terbaru pada hari yang sama.

---

# 5. Placement

## Desktop

```text
┌──────────────────────┬─────────────────┐
│ Produk & Keranjang   │ Riwayat Hari Ini│
└──────────────────────┴─────────────────┘
```

---

## Mobile

Posisi:

```text
Kasir
↓
Keranjang
↓
Riwayat Hari Ini
```

atau

```text
Bottom Sheet
```

yang dapat dibuka ketika dibutuhkan.

---

# 6. Scope

## Included

### View Today's Transactions

### View Transaction Detail

### Reprint Receipt

### Resend WhatsApp Receipt

### Mark Kasbon as Paid

### Search Today's Transaction

---

## Excluded

### Edit Transaction

### Delete Transaction

### Historical Transactions (Hari Sebelumnya)

Karena sudah masuk ke Menu Laporan.

---

# 7. Data Source

Collection:

```json
transactions
```

Filter:

```typescript
date >= startOfToday
date <= endOfToday
```

Urutan:

```typescript
created_at desc
```

---

# 8. Transaction Card

## Information

Tampilkan:

```text
Jam
No Nota
Total
Metode Pembayaran
Status
```

---

## Example Cash

```text
10:35

TRX-20260720-001

Cash

Rp25.000

LUNAS
```

---

## Example Kasbon

```text
11:12

TRX-20260720-002

Pak Joko

Rp50.000

KASBON
```

---

# 9. Status Indicator

## Cash

```text
🟢 Lunas
```

---

## Kasbon

```text
🟠 Kasbon
```

---

## Offline Pending Sync

```text
🟡 Menunggu Sinkronisasi
```

---

# 10. Maximum Display

Default:

```text
10 transaksi terakhir
```

---

Action:

```text
Lihat Semua
```

untuk membuka daftar lengkap transaksi hari ini.

---

# 11. Transaction Detail Modal

Ketika transaksi dipilih:

```text
Klik Transaksi
↓
Detail Modal
```

---

## Detail Information

```text
No Nota

Tanggal

Jam

Metode Pembayaran

Status

Daftar Produk

Total
```

---

## Example

```text
TRX-20260720-001

20 Juli 2026
10:35

Cash

--------------------

Indomie x2

Rp7.000

Minyak x1

Rp18.000

--------------------

Total

Rp25.000
```

---

# 12. Actions

Pada detail transaksi:

```text
[ Cetak Nota ]

[ Kirim WhatsApp ]

[ Tutup ]
```

---

# 13. Kasbon Actions

Jika transaksi adalah kasbon:

Tambahkan:

```text
[ Lunasi ]
```

---

## Flow

```text
Klik Lunasi
↓
Konfirmasi
↓
Update Status
↓
Kasbon Selesai
```

---

# 14. Search Feature

Tambahkan pencarian sederhana.

---

## Search By

```text
No Nota

Nama Pelanggan

Nama Produk
```

---

## Example

```text
Cari:

Pak Joko
```

---

Result:

```text
TRX-20260720-002
TRX-20260720-007
```

---

# 15. Realtime Update

Saat transaksi berhasil dibuat:

```text
Save Transaction
↓
Refresh Widget
↓
Transaksi Muncul
```

Tanpa perlu refresh halaman.

---

# 16. Offline Support

Jika Firestore Offline Persistence aktif:

```text
Transaksi Offline
↓
Tetap Muncul
↓
Dapat Dilihat
```

---

Status:

```text
🟡 Menunggu Sinkronisasi
```

ditampilkan sampai sinkronisasi berhasil.

---

# 17. Performance Requirements

## Initial Load

Target:

```text
< 300 ms
```

---

## Realtime Update

Target:

```text
< 1 detik
```

setelah transaksi berhasil dibuat.

---

## Maximum Records

Default:

```text
50 transaksi hari ini
```

untuk menjaga performa.

---

# 18. Database Optimization

## Suggested Index

```text
transactions

date DESC
```

---

## Query Example

```typescript
where("transaction_date", ">=", startOfToday)
orderBy("transaction_date", "desc")
limit(50)
```

---

# 19. Mobile UX Requirements

## Card Height

Minimal:

```text
72 px
```

---

## Touch Area

Minimal:

```text
48 x 48 px
```

---

## Bottom Sheet

Pada mobile:

```text
Riwayat Hari Ini
```

lebih disarankan menggunakan:

```text
Bottom Sheet
```

agar tidak mengganggu area kasir.

---

# 20. Future Enhancement

## Phase 2

Tambahkan:

```text
Filter:

Cash
Kasbon
```

---

## Phase 3

Tambahkan:

```text
Filter:

Kasbon Aktif
Kasbon Lunas
```

---

## Phase 4

Tambahkan:

```text
Quick Refund
```

jika suatu saat diperlukan.

---

# 21. Acceptance Criteria

## Transaction List

✅ Menampilkan transaksi hari ini

✅ Urut dari terbaru ke terlama

✅ Realtime update

---

## Transaction Detail

✅ Menampilkan detail transaksi

✅ Menampilkan item transaksi

✅ Menampilkan total transaksi

---

## Actions

✅ Reprint nota

✅ Kirim ulang WhatsApp

✅ Lunasi kasbon

---

## Offline

✅ Transaksi offline tetap muncul

✅ Status sinkronisasi terlihat

---

# Final Recommendation

Untuk MVP Warung Resoyudan, fitur **Riwayat Transaksi Hari Ini** sebaiknya ditempatkan langsung di halaman Kasir sebagai widget cepat yang menampilkan **10 transaksi terakhir** dan menyediakan akses instan ke:

```text
✅ Detail Transaksi
✅ Cetak Ulang Nota
✅ Kirim Ulang WhatsApp
✅ Pelunasan Kasbon
```

Pendekatan ini memberikan manfaat operasional yang besar dengan kompleksitas implementasi yang rendah, serta membantu pengguna menyelesaikan masalah transaksi harian tanpa harus berpindah ke menu laporan atau dashboard.
