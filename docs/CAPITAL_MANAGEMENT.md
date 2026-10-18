# CAPITAL_MANAGEMENT.md

# Capital Management Plan

**Feature Name:** Capital Management
**Module:** Capital
**Version:** 1.0
**Status:** Planning
**Last Updated:** August 2026

---

# 1. Overview

Capital Management memungkinkan pemilik usaha mencatat seluruh modal yang ditanamkan ke dalam usaha.

Modul ini digunakan untuk menghitung:

* Total Modal
* Penambahan Modal
* Penarikan Modal
* Break-even Progress (Balik Modal)
* Remaining Capital
* Return on Investment (ROI) pada fase berikutnya

Berbeda dengan **Expense**, transaksi pada modul ini **tidak dihitung sebagai biaya operasional**, melainkan sebagai perubahan nilai investasi pemilik pada usaha.

---

# 2. Goals

## Business Goals

* Mengetahui total modal usaha yang telah ditanamkan.
* Mengukur perkembangan usaha terhadap modal yang telah dikeluarkan.
* Mengetahui apakah usaha telah mencapai titik balik modal (Break-even Point).
* Menyediakan data yang lebih akurat untuk laporan keuangan.

## User Goals

* Mencatat modal awal.
* Menambahkan modal kapan saja.
* Mencatat penarikan modal oleh pemilik.
* Melihat progres balik modal secara real-time.

---

# 3. Business Problem

Saat ini aplikasi hanya mencatat transaksi penjualan dan pengeluaran operasional.

Akibatnya:

* Pengguna tidak mengetahui berapa total modal yang telah diinvestasikan.
* Tidak dapat mengetahui apakah usaha sudah balik modal.
* Sulit mengukur perkembangan bisnis secara keseluruhan.

---

# 4. Solution

Tambahkan modul baru:

Capital

Menu ini digunakan untuk:

* Melihat histori modal
* Menambah modal
* Menarik modal
* Melihat total modal aktif
* Melihat progress balik modal

---

# 5. Scope

## Included

* Initial Capital
* Capital Addition
* Capital Withdrawal
* Capital History
* Break-even Progress
* Dashboard Integration
* Reports Integration

## Excluded

* Investor Management
* Share Ownership
* Profit Sharing
* Asset Depreciation

---

# 6. Database

Collection

capital_transactions

```json
{
  "id": "string",
  "capital_number": "CAP-20260801-001",
  "transaction_date": "timestamp",
  "type": "initial",
  "amount": 10000000,
  "description": "Modal awal usaha",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

# 7. Transaction Types

Supported Types

| Type       | Description                  |
| ---------- | ---------------------------- |
| initial    | Modal pertama kali           |
| addition   | Penambahan modal             |
| withdrawal | Penarikan modal oleh pemilik |

---

# 8. Capital Number

Format

CAP-YYYYMMDD-XXX

Example

CAP-20260801-001

---

# 9. Capital Form

Fields

* Transaction Date
* Transaction Type
* Amount
* Description

Validation

* Amount wajib lebih dari 0.
* Initial Capital hanya boleh dibuat satu kali.
* Addition dan Withdrawal dapat dibuat tanpa batas.

---

# 10. Capital List

Card Information

* Capital Number
* Date
* Type
* Amount

Actions

* View
* Edit
* Delete

---

# 11. Capital Calculation

Current Capital

```
Initial Capital
+ Total Addition
- Total Withdrawal
```

---

# 12. Break-even Calculation

Gross Profit

```
Total Selling Price
-
Cost of Goods Sold
```

Net Profit

```
Gross Profit
-
Operating Expenses
```

Break-even Progress

```
(Net Profit / Current Capital) × 100%
```

Remaining Capital

```
Current Capital
-
Net Profit
```

---

# 13. Dashboard Integration

Tambahkan kartu baru pada Dashboard.

Cards

* Current Capital
* Gross Profit
* Net Profit
* Break-even Progress
* Remaining Capital

Example

```
Current Capital

Rp10.000.000
```

```
Break-even Progress

62%
```

```
Remaining Capital

Rp3.800.000
```

Jika Break-even Progress ≥ 100%

Tampilkan

```
✅ Business has reached Break-even Point
```

---

# 14. Reports Integration

Tambahkan ringkasan modal pada Reports.

Summary

* Initial Capital
* Additional Capital
* Capital Withdrawals
* Current Capital
* Gross Profit
* Net Profit
* Break-even Progress

---

# 15. Delete Flow

Select Capital Transaction

↓

Delete

↓

Confirmation Dialog

Dialog

```
Delete Capital Transaction

Are you sure you want to delete this capital transaction?

This action may affect capital calculations.

[Cancel]

[Delete]
```

---

# 16. Edit Flow

Select Capital Transaction

↓

Edit

↓

Update Data

↓

Recalculate Capital

↓

Refresh Dashboard

↓

Refresh Reports

---

# 17. Acceptance Criteria

✅ User dapat mencatat modal awal.

✅ Initial Capital hanya dapat dibuat satu kali.

✅ User dapat menambah modal.

✅ User dapat melakukan penarikan modal.

✅ Dashboard menampilkan Current Capital.

✅ Dashboard menampilkan Break-even Progress.

✅ Reports menampilkan ringkasan modal.

✅ Seluruh perhitungan diperbarui secara otomatis setelah transaksi modal dibuat, diubah, atau dihapus.

---

# 18. Future Enhancement

Planned Features

* ROI (Return on Investment)
* Capital Growth Chart
* Monthly Capital Report
* Investor Management
* Asset Management
* Business Valuation
* Multi-Branch Capital Tracking
