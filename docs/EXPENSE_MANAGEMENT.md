# EXPENSE_MANAGEMENT.md

# Expense Management Plan

**Feature Name:** Expense Management
**Module:** Expenses
**Version:** 1.0
**Status:** Planning
**Last Updated:** August 2026

---

# 1. Overview

Expense Management memungkinkan pemilik warung mencatat seluruh pengeluaran operasional yang tidak berasal dari transaksi penjualan.

Contoh pengeluaran:

- Belanja stok dari supplier
- Pembelian plastik
- Pembelian gas LPG
- Pembelian listrik
- Air minum
- Biaya transportasi
- Peralatan kebersihan
- Pengeluaran operasional lainnya

Pengeluaran akan mempengaruhi laporan keuntungan usaha namun tidak mempengaruhi transaksi penjualan.

---

# 2. Goals

## Business Goals

- Mengetahui seluruh pengeluaran usaha.
- Menghitung keuntungan bersih secara lebih akurat.
- Mempermudah pembukuan harian.

## User Goals

- Mencatat pengeluaran dengan cepat.
- Menyimpan bukti pembelian.
- Melihat histori pengeluaran.

---

# 3. Business Problem

Pemilik warung sering membeli kebutuhan toko menggunakan uang tunai namun tidak pernah dicatat.

Akibatnya:

- Laba terlihat lebih besar dari kondisi sebenarnya.
- Sulit mengetahui kemana uang digunakan.
- Sulit membuat laporan usaha.

---

# 4. Solution

Tambahkan menu baru:

Expenses

Menu digunakan untuk:

- Melihat daftar pengeluaran
- Menambah pengeluaran
- Mengedit pengeluaran
- Menghapus pengeluaran

---

# 5. Scope

## Included

- Add Expense
- Edit Expense
- Delete Expense
- Expense List
- Search Expense
- Upload Receipt Photo
- Expense Detail

## Excluded

- Supplier Management
- Purchase Order
- Inventory Receiving

---

# 6. Database

Collection:

expenses

```json
{
  "id": "string",
  "expense_number": "EXP-20260801-001",
  "expense_date": "timestamp",
  "title": "Pembelian Gas",
  "description": "",
  "category": "Operational",
  "total_amount": 25000,
  "receipt_image": "",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

# 7. Expense Number

Format

EXP-YYYYMMDD-XXX

Example

EXP-20260801-001

---

# 8. Expense Form

Fields

- Expense Date
- Expense Title
- Category
- Description
- Total Cost
- Receipt Photo (Optional)

---

# 9. Receipt Upload

Receipt photo bersifat opsional.

Supported:

- JPG
- PNG
- WEBP

---

# 10. Expense List

Card Information

- Expense Number
- Title
- Date
- Total Cost

Actions

- View
- Edit
- Delete

---

# 11. Search

Search By

- Expense Number
- Title
- Category

---

# 12. Delete Flow

Select Expense
↓

Delete
↓

Confirmation Dialog
↓

Delete Expense

Dialog

Are you sure you want to delete this expense?

[Cancel]
[Delete]

---

# 13. Acceptance Criteria

✅ User dapat menambah pengeluaran

✅ User dapat mengedit pengeluaran

✅ User dapat menghapus pengeluaran

✅ Upload foto nota bersifat opsional

✅ Data tampil pada daftar pengeluaran