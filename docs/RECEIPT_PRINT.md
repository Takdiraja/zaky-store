# RECEIPT_PRINT.md

# Receipt Delivery & Thermal Printing Plan

**Feature Name:** Receipt Delivery & Thermal Printing
**Module:** Cashier (POS)
**Version:** 2.0
**Status:** Approved for MVP
**Last Updated:** July 2026

---

# 1. Overview

Fitur Receipt Delivery & Thermal Printing memungkinkan pengguna mengirim atau mencetak nota transaksi setelah proses checkout selesai.

Berdasarkan target pengguna Warung Resoyudan (warung kecil, UMKM, dan pengguna non-teknis), fokus implementasi akan diarahkan pada:

### Core Features

* Kirim Nota melalui WhatsApp
* Cetak Nota menggunakan Printer Thermal Bluetooth

Pendekatan ini dipilih karena:

* Tidak membutuhkan perangkat tambahan yang kompleks.
* Sudah sesuai dengan kebiasaan pengguna UMKM di Indonesia.
* Memberikan nilai bisnis tertinggi dengan effort pengembangan yang relatif rendah.
* Dapat digunakan langsung setelah transaksi selesai.

---

# 2. Product Goals

## Business Goals

* Memberikan bukti transaksi kepada pelanggan.
* Mempermudah transaksi kasbon.
* Mengurangi kebutuhan nota tulis tangan.
* Meningkatkan profesionalitas warung.
* Mempermudah dokumentasi usaha untuk KUR dan pembiayaan.

---

## User Goals

* Dapat mengirim nota ke WhatsApp pelanggan dalam satu klik.
* Dapat mencetak nota langsung menggunakan printer Bluetooth.
* Tidak perlu melakukan konfigurasi yang rumit.
* Tetap dapat melakukan transaksi dengan cepat.

---

# 3. Scope

## Included (MVP)

### WhatsApp Receipt

* Kirim nota ke WhatsApp pelanggan.
* Generate format nota otomatis.
* Share tanpa memerlukan WhatsApp Business API.

### Bluetooth Thermal Printing

* Pair printer Bluetooth.
* Cetak nota setelah checkout.
* Reprint nota dari histori transaksi.

---

## Excluded

### Future Release

* PDF Export
* USB Thermal Printer
* WiFi Printer
* Network Printer
* Auto Print
* Multi Printer

---

# 4. User Flow

## Flow A — WhatsApp Receipt

```text
Checkout
↓
Transaksi Berhasil
↓
Klik "Kirim WhatsApp"
↓
WhatsApp Dibuka
↓
Pesan Nota Terisi Otomatis
↓
Kirim
```

---

## Flow B — Bluetooth Printing

```text
Checkout
↓
Transaksi Berhasil
↓
Klik "Cetak Nota"
↓
Printer Bluetooth
↓
Nota Tercetak
```

---

## Flow C — Reprint

```text
Riwayat Transaksi
↓
Pilih Transaksi
↓
Cetak Ulang
```

---

# 5. WhatsApp Receipt

## Overview

Sistem akan menghasilkan format nota berbentuk teks dan mengirimkannya melalui WhatsApp.

Metode ini tidak memerlukan:

* WhatsApp Business API
* Meta Approval
* Webhook
* Server tambahan

Sistem hanya membuka WhatsApp dengan pesan yang sudah diisi otomatis.

---

# 6. Customer Database Changes

## Collection: customers

Tambahkan field:

```json
{
  "phone": "string"
}
```

Contoh:

```json
{
  "name": "Pak Joko",
  "phone": "6281234567890"
}
```

Format nomor wajib menggunakan:

```text
62xxxxxxxxxx
```

---

# 7. WhatsApp Receipt Template

## Cash Transaction

```text
🧾 WARUNG RESOYUDAN

No Nota
TRX-20260720-001

Tanggal
20 Juli 2026

-------------------------

Indomie Goreng
2 x Rp3.500
= Rp7.000

Minyak Goreng 1L
1 x Rp18.000
= Rp18.000

-------------------------

TOTAL
Rp25.000

Terima kasih 🙏
```

---

## Kasbon Transaction

```text
🧾 WARUNG RESOYUDAN

No Nota
TRX-20260720-001

Pelanggan
Pak Joko

Status
KASBON

-------------------------

Indomie Goreng
2 x Rp3.500
= Rp7.000

-------------------------

TOTAL HUTANG
Rp7.000

Terima kasih 🙏
```

---

# 8. WhatsApp Integration

## Method

Menggunakan:

```typescript
https://wa.me/
```

---

## Example

```typescript
const message = encodeURIComponent(receiptText)

window.open(
  `https://wa.me/6281234567890?text=${message}`
)
```

---

## Validation

Sebelum membuka WhatsApp:

* Nomor wajib tersedia.
* Nomor wajib valid.
* Transaksi harus sudah tersimpan.

---

## Error Handling

### Phone Not Found

Toast:

```text
Nomor WhatsApp pelanggan belum tersedia.
```

---

### Invalid Phone Number

Toast:

```text
Nomor WhatsApp tidak valid.
```

---

# 9. Bluetooth Thermal Printing

## Overview

Sistem mendukung pencetakan nota menggunakan printer thermal Bluetooth yang umum digunakan oleh UMKM.

---

# 10. Supported Devices

Target awal:

### 58mm Printer

* XPrinter XP-58
* Rongta RP58
* Goojprt 58mm

---

### 80mm Printer

* XPrinter XP-80
* Rongta RP80
* Epson TM Series

---

# 11. Technology

## Browser API

Gunakan:

```javascript
Web Bluetooth API
```

---

## Printer Command Standard

Gunakan:

```text
ESC/POS
```

Karena menjadi standar industri printer thermal.

---

# 12. Thermal Print Flow

## First Connection

```text
Pengaturan Printer
↓
Tambah Printer
↓
Scan Bluetooth Device
↓
Pilih Printer
↓
Simpan
```

---

## Printing

```text
Checkout
↓
Klik Cetak Nota
↓
Connect Printer
↓
Generate ESC/POS
↓
Print
```

---

# 13. Printer Settings

Tambahkan menu baru:

```text
Pengaturan Printer
```

---

## Configuration

### Printer Name

```text
XPrinter XP-58
```

---

### Paper Width

```text
58 mm
80 mm
```

---

### Test Print

```text
Cetak Test
```

---

### Reconnect Printer

```text
Hubungkan Ulang
```

---

# 14. Thermal Receipt Layout

## Header

```text
WARUNG RESOYUDAN
```

---

## Transaction Info

```text
No Nota
Tanggal
Jam
```

---

## Item List

```text
--------------------------------

Indomie Goreng

2 x 3500
7000

--------------------------------
```

---

## Total

```text
TOTAL
25000
```

---

## Footer

```text
Terima kasih
```

---

# 15. Receipt Numbering

## Format

```text
TRX-YYYYMMDD-XXX
```

Contoh:

```text
TRX-20260720-001
TRX-20260720-002
TRX-20260720-003
```

---

# 16. Database Changes

## Collection: transactions

Tambahkan:

```json
{
  "receipt_number": "string",
  "receipt_sent": false,
  "receipt_sent_at": null,
  "printed_at": null,
  "print_count": 0
}
```

---

# 17. Transaction Success Dialog

Setelah transaksi berhasil:

```text
┌────────────────────────┐
│ Transaksi Berhasil     │
├────────────────────────┤
│ Cetak Nota             │
│ Kirim WhatsApp         │
│ Selesai                │
└────────────────────────┘
```

---

# 18. Reprint Feature

## Access

```text
Riwayat Transaksi
↓
Detail Transaksi
↓
Cetak Ulang
```

---

## Rules

Setiap reprint:

```json
{
  "print_count": 2
}
```

akan bertambah.

---

# 19. Offline Behavior

## WhatsApp

Tidak dapat dikirim jika:

```text
Tidak ada koneksi internet
```

Tampilkan:

```text
WhatsApp membutuhkan koneksi internet.
```

---

## Thermal Printer

Tetap dapat digunakan ketika offline.

Karena:

```text
Bluetooth tidak membutuhkan internet.
```

---

# 20. Technical Architecture

```text
Cashier Module
│
├── Receipt Generator
│   ├── WhatsApp Formatter
│   └── ESC/POS Formatter
│
├── Receipt Delivery
│   ├── WhatsApp Sender
│   └── Bluetooth Printer
│
└── Transaction History
    └── Reprint Service
```

---

# 21. Acceptance Criteria

## WhatsApp Receipt

✅ Nota dapat dibuat otomatis

✅ WhatsApp dapat dibuka otomatis

✅ Pesan terisi otomatis

✅ Nomor pelanggan tervalidasi

---

## Bluetooth Printing

✅ Printer Bluetooth dapat dipilih

✅ Printer dapat dihubungkan

✅ Nota dapat dicetak

✅ Reprint berjalan

✅ Support kertas 58mm

✅ Support kertas 80mm

---

# 22. Recommended MVP Priority

## Priority 1 (Wajib)

### WhatsApp Receipt

Alasan:

* Hampir semua pelanggan menggunakan WhatsApp.
* Tidak membutuhkan hardware tambahan.
* Biaya implementasi sangat rendah.

---

## Priority 2 (Wajib)

### Bluetooth Thermal Printer

Alasan:

* Banyak digunakan warung dan UMKM.
* Mendukung operasional harian secara langsung.
* Tidak bergantung pada internet.

---

# Final Recommendation

Untuk MVP Warung Resoyudan, implementasikan:

```text
✅ WhatsApp Receipt
✅ Bluetooth Thermal Printing
✅ Reprint Transaction
✅ Printer Settings
```

dan tunda fitur PDF, USB Printer, WiFi Printer, serta Auto Print hingga aplikasi telah digunakan secara aktif dan kebutuhan pengguna tervalidasi di lapangan.
