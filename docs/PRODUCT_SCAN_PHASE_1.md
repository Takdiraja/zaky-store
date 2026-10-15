# PRODUCT_SCAN.md

# Product Scanning Feature Plan

**Feature Name:** Product Scanning
**Module:** Product Management & Cashier (POS)
**Version:** 1.0
**Status:** Planning
**Last Updated:** July 2026

---

# 1. Overview

Fitur Product Scanning memungkinkan pengguna menambahkan dan mencari produk menggunakan barcode scanner berbasis kamera perangkat.

Tujuan utama fitur ini adalah:

* Mempercepat proses input produk baru.
* Mempercepat transaksi kasir.
* Mengurangi kesalahan input manual.
* Meminimalkan jumlah klik pada proses operasional harian.

Fitur akan tersedia pada:

1. Menu Produk
2. Menu Kasir

---

# 2. Business Goals

## Product Management

Mengurangi waktu input produk baru dengan memanfaatkan barcode produk yang sudah tersedia pada kemasan.

## Cashier

Mempercepat proses pencarian produk saat transaksi berlangsung.

Target:

* Scan → Produk ditemukan → Masuk keranjang < 1 detik.
* Scan → Produk ditemukan → Input produk baru < 30 detik.

---

# 3. User Stories

## Product Menu

### US-PROD-001

Sebagai pemilik warung,

Saya ingin menambahkan produk secara manual,

Agar tetap dapat memasukkan produk yang tidak memiliki barcode.

---

### US-PROD-002

Sebagai pemilik warung,

Saya ingin menambahkan produk melalui scan barcode,

Agar tidak perlu mengetik barcode secara manual.

---

### US-PROD-003

Sebagai pemilik warung,

Saya ingin barcode otomatis terisi setelah berhasil scan,

Agar mempercepat proses input produk.

---

## Cashier Menu

### US-CASH-001

Sebagai kasir,

Saya ingin melakukan scan barcode produk,

Agar produk langsung masuk ke keranjang tanpa harus mencari secara manual.

---

### US-CASH-002

Sebagai kasir,

Saya ingin melakukan scan beberapa produk berturut-turut,

Agar proses transaksi lebih cepat.

---

### US-CASH-003

Sebagai kasir,

Saya ingin mendapatkan informasi ketika produk belum terdaftar,

Agar saya mengetahui bahwa produk perlu ditambahkan terlebih dahulu.

---

# 4. Product Database Changes

## Collection: products

Tambahkan field baru:

```json
{
  "barcode": "string | null"
}
```

Contoh:

```json
{
  "id": "abc123",
  "barcode": "8991234567890",
  "name": "Indomie Goreng",
  "buy_price": 2500,
  "sell_price": 3500,
  "stock": 20
}
```

---

# 5. Barcode Support

## Supported Formats

Minimum support:

```text
EAN-13
EAN-8
UPC-A
UPC-E
CODE-128
CODE-39
ITF
QR Code
```

Walaupun fokus utama adalah barcode produk retail (EAN/UPC), sistem tetap mendukung QR Code untuk kebutuhan masa depan.

---

# 6. Menu Produk

## Entry Point

Floating Action Button (FAB)

Posisi:

```text
Bottom Right
```

Icon:

```text
+
```

---

## Interaction Flow

Ketika FAB ditekan:

Muncul Speed Dial:

```text
+
├── Tambah Manual
└── Scan Produk
```

---

# 7. Tambah Manual Flow

## User Flow

```text
Klik FAB
    ↓
Tambah Manual
    ↓
Dialog Form Produk
    ↓
Isi Data
    ↓
Simpan
```

---

## Form Fields

| Field        | Required |
| ------------ | -------- |
| Nama Produk  | Yes      |
| Barcode      | No       |
| Harga Beli   | Yes      |
| Harga Jual   | Yes      |
| Stok Awal    | Yes      |
| Minimum Stok | No       |

---

# 8. Scan Produk Flow

## User Flow

```text
Klik FAB
    ↓
Scan Produk
    ↓
Permission Kamera
    ↓
Camera Scanner
    ↓
Barcode Terdeteksi
    ↓
Dialog Produk
    ↓
Lengkapi Data
    ↓
Simpan
```

---

## Scanner Screen

Komponen:

* Camera Preview
* Scan Area Overlay
* Tombol Tutup

---

## Scan Success

Ketika barcode berhasil dibaca:

```text
8991234567890
```

Maka:

1. Scanner ditutup.
2. Dialog produk dibuka.
3. Field barcode otomatis terisi.
4. User melengkapi field lainnya.

---

## Product Form After Scan

| Field        | Value       |
| ------------ | ----------- |
| Barcode      | Auto Filled |
| Nama Produk  | Empty       |
| Harga Beli   | Empty       |
| Harga Jual   | Empty       |
| Stok Awal    | Empty       |
| Minimum Stok | Empty       |

---

## Validation

### Duplicate Barcode

Jika barcode sudah terdaftar:

Tampilkan dialog:

```text
Barcode sudah digunakan oleh produk:
"Indomie Goreng"

Silakan gunakan barcode lain.
```

Tombol:

```text
Tutup
```

---

# 9. Menu Kasir

## Entry Points

### Cashier Page

Posisi:

```text
Bottom Right
```

Icon:

```text
Barcode Scanner
```

---

### Cart Drawer

Tambahkan tombol baru:

```text
[ Scan Barcode ] [ Konfirmasi & Bayar ]
```

Posisi:

```text
Scan Barcode berada di kiri tombol Konfirmasi & Bayar
```

---

# 10. Cashier Scan Flow

## User Flow

```text
Klik Scan
    ↓
Camera Scanner
    ↓
Barcode Terdeteksi
    ↓
Cari Produk
```

---

## Scenario A - Product Found

```text
Barcode ditemukan
```

Sistem:

1. Cari produk berdasarkan barcode.
2. Tambahkan ke keranjang.
3. Jika produk sudah ada:

```text
quantity += 1
```

4. Tampilkan toast sukses.

Contoh:

```text
Indomie Goreng ditambahkan ke keranjang.
```

5. Scanner tetap aktif.

---

## Scenario B - Product Not Found

```text
Barcode tidak ditemukan
```

Tampilkan toast:

```text
Produk belum tersedia.
Silakan tambahkan melalui menu Produk.
```

Scanner tetap aktif.

---

# 11. Continuous Scanning Mode

## Requirement

Scanner tidak boleh tertutup otomatis setelah scan berhasil.

Tujuan:

Mendukung scan banyak produk secara berurutan.

---

## Example

```text
Scan A
↓
Masuk Keranjang

Scan B
↓
Masuk Keranjang

Scan C
↓
Masuk Keranjang

Scan D
↓
Masuk Keranjang
```

Scanner tetap terbuka.

---

## Exit Conditions

Scanner hanya ditutup ketika:

### Option 1

User klik:

```text
Tutup Scanner
```

---

### Option 2

User klik:

```text
Lihat Keranjang
```

---

# 12. Cart Behavior

## Product Exists

Jika produk sudah ada di keranjang:

```text
qty = qty + 1
```

Contoh:

```text
Scan Indomie
qty = 1

Scan Indomie
qty = 2

Scan Indomie
qty = 3
```

---

## Product Out Of Stock

Jika:

```text
stock <= 0
```

Tampilkan toast:

```text
Stok produk habis.
```

Produk tidak masuk ke keranjang.

---

## Quantity Validation

Jika quantity keranjang sudah mencapai stok:

```text
qty == stock
```

Tampilkan toast:

```text
Jumlah melebihi stok tersedia.
```

---

# 13. UI Components

## Product Menu

### Components

```text
ProductPage
├── ProductTable
├── ProductFAB
├── ProductSpeedDial
├── ProductScannerDialog
└── ProductFormDialog
```

---

## Cashier Menu

### Components

```text
CashierPage
├── ProductGrid
├── CartDrawer
├── ScanBarcodeButton
├── ScannerDialog
└── CheckoutDialog
```

---

# 14. Technical Requirements

## Camera Library

Recommended:

```text
@zxing/browser
```

Alternatives:

```text
html5-qrcode
```

---

## Scanner Performance

Target:

| Metric            | Target   |
| ----------------- | -------- |
| Camera Open       | < 1 sec  |
| Barcode Detection | < 500 ms |
| Product Lookup    | < 500 ms |
| Add To Cart       | < 100 ms |

---

## Product Lookup

Firestore Query:

```typescript
where("barcode", "==", scannedBarcode)
```

Requirement:

```text
Barcode field must be indexed.
```

---

# 15. Error Handling

## Camera Permission Denied

Toast:

```text
Akses kamera ditolak.
Izinkan kamera untuk menggunakan fitur scan.
```

---

## Camera Not Available

Toast:

```text
Kamera tidak tersedia.
```

---

## Invalid Barcode

Toast:

```text
Barcode tidak dapat dibaca.
Coba arahkan kamera lebih dekat.
```

---

## Duplicate Product Barcode

Toast:

```text
Barcode sudah digunakan oleh produk lain.
```

---

# 16. Acceptance Criteria

## Product Menu

### Manual Input

✅ FAB muncul pada halaman produk

✅ Speed Dial muncul saat FAB ditekan

✅ Tambah Manual membuka dialog produk

---

### Scan Product

✅ Kamera dapat dibuka

✅ Barcode berhasil dibaca

✅ Barcode otomatis terisi

✅ Form produk muncul setelah scan

✅ Validasi barcode duplikat berjalan

---

## Cashier Menu

### Scan Product

✅ Tombol scan tersedia pada halaman kasir

✅ Tombol scan tersedia pada keranjang

✅ Produk ditemukan otomatis masuk keranjang

✅ Produk yang sama menambah quantity

✅ Produk tidak ditemukan menampilkan toast

✅ Scanner tetap aktif setelah scan berhasil

✅ Scanner hanya tertutup ketika user memilih tutup atau lihat keranjang

---