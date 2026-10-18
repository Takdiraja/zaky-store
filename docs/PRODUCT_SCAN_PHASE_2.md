# PRODUCT_SCAN_PHASE_2.md

# Product Scanning Phase 2 Enhancement Plan

**Feature Name:** Product Scanning Phase 2
**Module:** Product Management & Cashier (POS)
**Version:** 2.0
**Status:** Planning
**Last Updated:** July 2026

---

# 1. Overview

Phase 2 berfokus pada peningkatan pengalaman pengguna (UX) dan percepatan proses input produk dengan memanfaatkan database barcode publik serta peningkatan kemampuan scanner.

Tujuan utama fase ini adalah mengurangi kebutuhan input manual saat menambahkan produk baru dan meningkatkan efisiensi proses scanning pada menu Produk maupun Kasir.

---

# 2. Goals

## Business Goals

* Mengurangi waktu pembuatan produk baru.
* Mengurangi kesalahan input nama produk.
* Mempercepat onboarding data inventaris.
* Meningkatkan pengalaman pengguna saat menggunakan scanner.

## User Goals

* Produk dapat dikenali secara otomatis setelah barcode berhasil dipindai.
* Tidak perlu mengetik nama produk secara manual jika data tersedia.
* Dapat menggunakan kamera depan maupun belakang sesuai kondisi perangkat.
* Dapat menggunakan flashlight saat kondisi pencahayaan rendah.
* Mendapatkan feedback yang jelas ketika scan berhasil.

---

# 3. Scope

## Included

### Auto Product Lookup

* Auto fetch nama produk
* Auto fetch gambar produk

### Scanner Improvements

* Camera switcher (Front / Back)
* Torch / Flashlight
* Sound feedback

---

## Excluded

* AI Product Recognition
* OCR Product Recognition
* Barcode Label Generator
* Batch Inventory Scanning

---

# 4. Product Lookup Enhancement

## Overview

Saat barcode berhasil dipindai pada Menu Produk, sistem akan mencoba mengambil informasi produk dari database barcode publik sebelum menampilkan form produk.

Tujuannya agar pengguna hanya perlu melengkapi informasi yang belum tersedia.

---

# 5. External Barcode Database

## Candidate Providers

### Open Food Facts

Kelebihan:

* Gratis
* Open Source
* Tidak memerlukan biaya lisensi
* Mendukung banyak produk Indonesia

Data yang dapat diperoleh:

```json id="off-example"
{
  "barcode": "8998866201015",
  "product_name": "Indomie Mi Goreng",
  "image_url": "https://...",
  "brand": "Indomie"
}
```

---

## Alternative Providers

### Barcode Lookup

Provider komersial.

### UPCitemDB

Provider freemium.

### EANData

Provider berbayar.

---

## Recommended Provider

```text id="provider-recommendation"
Primary:
Open Food Facts

Fallback:
UPCitemDB
```

---

# 6. Product Creation Flow Enhancement

## Existing Flow

```text id="current-flow"
Scan Barcode
↓
Form Produk Kosong
↓
User Mengisi Semua Data
```

---

## New Flow

```text id="new-flow"
Scan Barcode
↓
Lookup Barcode Database
↓
Data Ditemukan
↓
Form Produk Terisi Sebagian
↓
User Melengkapi Data
↓
Simpan
```

---

# 6.1 Product Metadata Auto Fill

## Overview

Selain nama produk dan gambar, sistem akan mencoba mengambil informasi tambahan dari database barcode publik untuk mengurangi input manual saat membuat produk baru.

Metadata yang didukung:

* Brand Produk
* Kategori Produk

Tujuan:

* Mempercepat proses pembuatan produk.
* Menstandarkan data produk.
* Menjadi fondasi fitur analitik dan laporan kategori pada fase berikutnya.

---

# 6.2 Product Schema Changes

Tambahkan field baru pada collection `products`:

```json
{
  "brand": "string | null",
  "category": "string | null"
}
```

Contoh:

```json
{
  "id": "abc123",
  "barcode": "8998866201015",
  "name": "Indomie Mi Goreng",
  "brand": "Indomie",
  "category": "Mie Instan",
  "image_url": "https://...",
  "buy_price": 2500,
  "sell_price": 3500,
  "stock": 20
}
```

---

# 7. Scenario A - Product Found

## Example

Barcode:

```text id="barcode-example"
8998866201015
```

Database Response:

```json id="lookup-response"
{
  "name": "Indomie Mi Goreng",
  "image_url": "https://..."
}
```

---

## Form Result

| Field         | Value       |
| ------------- | ----------- |
| Barcode       | Auto Filled |
| Nama Produk   | Auto Filled |
| Gambar Produk | Auto Filled |
| Harga Beli    | Empty       |
| Harga Jual    | Empty       |
| Stok Awal     | Empty       |
| Minimum Stok  | Empty       |

---

## UI Behavior

Tampilkan toast:

```text id="product-found-toast"
Data produk ditemukan.
Silakan lengkapi informasi harga dan stok.
```

---

# 8. Scenario B - Product Not Found

Jika barcode tidak ditemukan pada provider.

## Flow

```text id="product-not-found-flow"
Scan Barcode
↓
Lookup Database
↓
Tidak Ditemukan
↓
Form Produk Kosong
```

---

## UI Behavior

Toast:

```text id="product-not-found-toast"
Produk tidak ditemukan pada database publik.
Silakan lengkapi data secara manual.
```

---

# 9. Product Image Support

## Overview

Sistem akan mencoba mengambil gambar produk dari provider barcode.

Jika tersedia:

* Preview gambar ditampilkan pada form.
* Gambar disimpan pada data produk.

---

## Product Schema Changes

Tambahkan field:

```json id="product-image-schema"
{
  "image_url": "string | null"
}
```

---

## Example

```json id="product-image-example"
{
  "barcode": "8998866201015",
  "name": "Indomie Mi Goreng",
  "image_url": "https://images.example.com/indomie.jpg"
}
```

---

## Fallback

Jika gambar tidak tersedia:

```text id="image-fallback"
Gunakan placeholder image.
```

---

# 10. Camera Selection Support

## Overview

Scanner harus mendukung pemilihan kamera.

---

## Supported Cameras

### Rear Camera

Default scanner camera.

Digunakan untuk:

* Scan barcode produk.
* Kondisi normal.

---

### Front Camera

Digunakan ketika:

* Rear camera bermasalah.
* Device hanya memiliki satu kamera.
* Pengguna ingin mengganti kamera.

---

## UI Components

Tambahkan tombol:

```text id="camera-switch-button"
Ganti Kamera
```

Icon:

```text id="camera-switch-icon"
camera-switch
```

---

## User Flow

```text id="camera-switch-flow"
Scanner Dibuka
↓
Klik Ganti Kamera
↓
Daftar Kamera
↓
Pilih Kamera
↓
Scanner Reload
```

---

## Acceptance Criteria

✅ Sistem dapat mendeteksi lebih dari satu kamera

✅ User dapat mengganti kamera

✅ Kamera yang dipilih digunakan hingga scanner ditutup

---

# 11. Torch / Flashlight Support

## Overview

Scanner harus mendukung flashlight pada perangkat yang memiliki torch.

---

## UI Components

Tambahkan tombol:

```text id="torch-button"
Flashlight
```

Icon:

```text id="torch-icon"
flashlight
```

---

## States

### OFF

```text id="torch-off"
Torch Disabled
```

---

### ON

```text id="torch-on"
Torch Enabled
```

---

## User Flow

```text id="torch-flow"
Scanner Dibuka
↓
Klik Flashlight
↓
Torch Aktif
↓
Klik Lagi
↓
Torch Nonaktif
```

---

## Device Compatibility

Torch hanya muncul jika:

```text id="torch-condition"
cameraCapabilities.torch === true
```

---

## Acceptance Criteria

✅ Tombol torch hanya muncul pada perangkat yang mendukung

✅ Torch dapat diaktifkan dan dinonaktifkan

✅ Tidak menyebabkan scanner restart

---

# 12. Sound Feedback

## Overview

Saat barcode berhasil dipindai, sistem memberikan feedback audio agar pengguna mengetahui bahwa scan berhasil tanpa harus melihat layar.

---

# 13. Scan Success Sound

## Trigger

Saat:

```text id="sound-trigger"
Barcode berhasil dibaca
```

---

## Behavior

Sistem:

1. Memainkan suara pendek.
2. Tidak mengganggu performa scanner.
3. Tetap berjalan pada continuous scanning mode.

---

## Recommended Sound

Durasi:

```text id="sound-duration"
100ms - 300ms
```

Karakteristik:

```text id="sound-characteristics"
Short Beep
POS Style
```

---

## Example Flow

```text id="sound-flow"
Scan Produk A
↓
Beep
↓
Produk Ditambahkan

Scan Produk B
↓
Beep
↓
Produk Ditambahkan
```

---

## Error Scan

Untuk barcode gagal dibaca:

```text id="error-sound"
Tidak ada suara diputar.
```

---

## Browser Restrictions

Karena browser dapat membatasi autoplay audio:

Sistem harus:

* Meminta interaksi user terlebih dahulu.
* Menginisialisasi audio saat scanner dibuka.



# 14. Product Lookup Data Mapping

## Supported Fields

| External Data | Product Field |
| ------------- | ------------- |
| product_name  | name          |
| brands        | brand         |
| categories    | category      |
| image_url     | image_url     |

---

## Example Provider Response

```json
{
  "code": "8998866201015",
  "product": {
    "product_name": "Indomie Mi Goreng",
    "brands": "Indomie",
    "categories": "Instant Noodles",
    "image_url": "https://..."
  }
}
```

---

## Mapping Result

```json
{
  "barcode": "8998866201015",
  "name": "Indomie Mi Goreng",
  "brand": "Indomie",
  "category": "Mie Instan",
  "image_url": "https://..."
}
```

---

# 15. Product Form Enhancement

## Product Form After Successful Lookup

| Field         | Source       |
| ------------- | ------------ |
| Barcode       | Auto Filled  |
| Nama Produk   | Auto Filled  |
| Brand         | Auto Filled  |
| Kategori      | Auto Filled  |
| Gambar Produk | Auto Filled  |
| Harga Beli    | Manual Input |
| Harga Jual    | Manual Input |
| Stok Awal     | Manual Input |
| Minimum Stok  | Manual Input |

---

## Editable Fields

Walaupun data berhasil ditemukan, seluruh field hasil lookup tetap dapat diedit oleh pengguna.

Contoh:

```text
Nama Produk : Indomie Mi Goreng
Brand       : Indomie
Kategori    : Mie Instan
```

Pengguna dapat mengubahnya menjadi:

```text
Nama Produk : Indomie Goreng Jumbo
Brand       : Indomie
Kategori    : Mie Instan
```

---

# 16. Category Normalization

## Overview

Data kategori dari provider sering tidak konsisten dan menggunakan bahasa Inggris.

Sistem perlu melakukan normalisasi sebelum disimpan ke database.

---

## Example Mapping

| Provider Category | Saved Category |
| ----------------- | -------------- |
| Instant Noodles   | Mie Instan     |
| Soft Drinks       | Minuman Ringan |
| Mineral Water     | Air Mineral    |
| Snacks            | Snack          |
| Biscuits          | Biskuit        |
| Coffee            | Kopi           |
| Tea               | Teh            |
| Milk              | Susu           |

---

## Fallback

Jika kategori tidak memiliki mapping:

```text
Lainnya
```

---

# 17. Brand Normalization

## Overview

Brand yang diterima dari provider akan disimpan sesuai data asli setelah dilakukan trimming dan cleaning sederhana.

Contoh:

Input:

```text
INDOMIE
```

Disimpan:

```text
Indomie
```

Input:

```text
PT INDOFOOD CBP SUKSES MAKMUR
```

Disimpan:

```text
Indofood
```

---

# Additional Acceptance Criteria

## Product Metadata Auto Fill

✅ Brand otomatis terisi jika tersedia dari provider

✅ Kategori otomatis terisi jika tersedia dari provider

✅ Brand tetap dapat diedit pengguna

✅ Kategori tetap dapat diedit pengguna

✅ Normalisasi kategori berjalan sebelum penyimpanan

✅ Sistem tetap dapat membuat produk meskipun brand atau kategori tidak ditemukan

✅ Suara diputar saat scan berhasil

✅ Tidak diputar saat scan gagal

✅ Berfungsi pada continuous scanning

✅ Tidak mengganggu performa scanner

---

# 18. UI Changes

## Product Scanner Dialog

Tambahan komponen:

```text id="product-scanner-ui"
Scanner Dialog
├── Camera Preview
├── Close Button
├── Camera Switch Button
├── Torch Button
└── Scan Area Overlay
```

---

## Cashier Scanner Dialog

Tambahan komponen:

```text id="cashier-scanner-ui"
Scanner Dialog
├── Camera Preview
├── Close Button
├── View Cart Button
├── Camera Switch Button
├── Torch Button
└── Scan Area Overlay
```

---

# 19. Technical Requirements

## Recommended Libraries

### Barcode Scanner

```text id="scanner-library"
@zxing/browser
```

---

### Sound Feedback

```text id="sound-library"
HTML Audio API
```

---

### Product Lookup

```text id="lookup-service"
Open Food Facts API
```

---

## Performance Targets

| Metric             | Target      |
| ------------------ | ----------- |
| Camera Open        | < 1 second  |
| Barcode Detection  | < 500 ms    |
| Product Lookup API | < 2 seconds |
| Sound Playback     | < 100 ms    |
| Camera Switch      | < 1 second  |

---

# 20. Error Handling

## Lookup Service Unavailable

Toast:

```text id="lookup-error-toast"
Layanan pencarian produk sedang tidak tersedia.
Silakan isi data secara manual.
```

---

## Network Timeout

Toast:

```text id="lookup-timeout-toast"
Pencarian produk terlalu lama.
Silakan lanjutkan secara manual.
```

---

## Camera Switch Failed

Toast:

```text id="camera-failed-toast"
Gagal mengganti kamera.
```

---

## Torch Not Supported

Toast:

```text id="torch-failed-toast"
Perangkat tidak mendukung flashlight.
```

---

# 21. Acceptance Criteria

## Auto Product Lookup

✅ Nama produk otomatis terisi jika ditemukan

✅ Gambar produk otomatis terisi jika ditemukan

✅ Tetap dapat melanjutkan jika lookup gagal

---

## Camera Selection

✅ User dapat memilih kamera depan atau belakang

✅ Scanner tetap berfungsi setelah pergantian kamera

---

## Torch Support

✅ Torch dapat dinyalakan

✅ Torch dapat dimatikan

✅ Hanya muncul pada perangkat yang mendukung

---

## Sound Feedback

✅ Beep diputar setiap scan berhasil

✅ Tidak diputar saat scan gagal

✅ Berfungsi pada continuous scanning mode

---
