# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: the owner of Warung Resoyudan, working alone. The owner is an operator-casher, not a tech person — records sales with a phone in one hand while customers wait, tolerates no complex accounting or multi-step flows, and wants the store's money and stock to stay separated from personal money.

Operating devices: an Android or iPhone today, with a tablet planned to be bought soon — so the UI must be equally at home on a phone and on a tablet/counter terminal. The store runs on Android; the app installs as a PWA from the browser (Firebase offline persistence keeps it usable when the connection drops).

## Product Purpose

A fast point-of-sale and simple bookkeeping app for a small warung (kelontong): record sales in under 3 minutes, manage product stock, track customer kasbon (debt) and its repayments, and produce simple business reports the owner can use for day-to-day decisions and as supporting documents when applying for KUR (business credit). The whole product is built so the owner never needs accounting knowledge or complex technology.

## Positioning

A kasir + bookkeeping app that treats the warung owner as the operator: sales recorded in seconds (tap grid, scan barcode, favorite products), kasbon as a first-class tracked entity, and stock that can never go negative even when two sales happen at once. Single-owner, single-device-first, PWA-installable, offline-tolerant — the counter register that also keeps the books, without forcing the owner into accounting concepts.

## Operating Context

- Daily routine: open the store, serve customers at the counter, record each sale as it happens, scan barcodes on packaging, and reconcile money at close of day.
- Owned financial routines: the owner keeps personal vs. business money separated and needs the books as evidence for a KUR credit application.
- Physical surroundings: a busy counter with customers waiting; interaction must tolerate one hand, quick taps, and interruptions.
- Devices: Android or iPhone phone today, tablet coming; the cashier flow must stay fast on phone and comfortable on tablet.
- Printing: 58/80mm Bluetooth thermal receipt printer connected to the device.
- Offline: Firebase offline persistence; the app stays usable without a connection and syncs when back online.

## Capabilities and Constraints

- Modules (implemented): Kasir (product grid, cart, Tunai/Kasbon/QRIS payment, barcode scan, favorites, drafts, today's history), Dashboard, Produk (CRUD, quick stock, favorites, scan-to-add, low-stock), Pelanggan, Kasbon (payments, history), Layanan Digital (pulsa/PLN/PDAM/etc. — service fees, not stock), Modal (initial/addition/withdrawal, break-even progress), Pengeluaran (operational expenses with optional receipt photo), Transaksi history, Laporan (period filters, charts, PDF export), Pengaturan (theme, store info, edit PIN), receipt printing over Bluetooth.
- Platform: Next.js 16 (Turbopack) + React 19, Tailwind CSS 4, shadcn/ui, Zustand, Firebase Firestore, Serwist PWA, html5-qrcode scanner, jsPDF export.
- Data storage: Firebase Firestore with offline persistence; indexDB; local draft storage. Data in the app today is real production store data — do not seed or overwrite it.
- Concurrency: Firestore transactions/batch writes required so stock never goes negative on simultaneous sales.
- Editing protection: a 4-digit edit PIN (default "1205") gates destructive management actions.
- No authentication: the app is a single-owner local tool; input validation and Firestore security rules are the control surface.
- Future/out-of-scope: multi-user, multi-branch, supplier management, thermal printer integration via Web Bluetooth (implemented as device pairing), WhatsApp integration.

## Brand Commitments

- Name: Warung Resoyudan (keep verbatim).
- There is no binding visual identity. The owner is open to a redesign; the current look is evidence, not a fixed brief. Voice is casual Indonesian (as in the current UI copy) unless the user changes it.

## Evidence on Hand

- Real production data in Firestore (products, transactions, customers, kasbon, reports) — never seed, reset, or mock it.
- PRD and feature plans in `docs/` (PRD.md, PRODUCT_SCAN_PHASE_1/2.md, PRODUCT_FAVORIT.md, CART_DRAFT.md, HISTORY_TRX_TODAY.md, TRANSACTION_DELETE.md, TRANSACTION_EDIT.md, EXPENSE_MANAGEMENT.md, CAPITAL_MANAGEMENT.md, RECEIPT_PRINT.md).
- Store address used on receipts: Brumbung RT 11, Kebayanan I, Ngandul, Sumberlawang, Sragen Regency, Central Java 57272.
- No testimonials, case studies, or marketing material exists; future work must not fabricate them.

## Product Principles

- Speed is the product: any sale must be completable in under three minutes, from tap/scan to confirmation.
- The owner is the operator: one hand, big touch targets, minimal inputs, no accounting jargon.
- Money and stock are sacred: transactions are atomic (Firestore transactions), kasbon is tracked precisely, and operational expenses and capital are recorded so profit is honest.
- One device, offline-friendly: works as a PWA on the phone today and a tablet later, tolerating a lost connection.
- Real data is live: never mock, seed, or destroy the store's actual records.

## Accessibility & Inclusion

No product-specific accessibility standard was confirmed beyond the PRD's mobile-first, one-hand-operation and large-touch-target (≥44px, recommended 48px) requirements. Default to those.
