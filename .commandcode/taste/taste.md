# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# icons
- Use lucide-react for all icons instead of Material Symbols. Confidence: 0.8

# api
- Use real Open Food Facts API for barcode product lookups with mock fallback. Confidence: 0.50

# language
- Accept bug reports and feature requests written in Indonesian (Bahasa). Confidence: 0.8
- Write all UI strings in Indonesian (Bahasa) for the app interface. Confidence: 0.7

# package-management
- Use pnpm for all package manager commands (install, lint, tsc, build). Confidence: 0.60

# whatsapp
- Use +62 prefix for WhatsApp phone numbers (not just 62). Confidence: 0.70
- Format WhatsApp receipt display neatly, not like thermal printer receipts. Confidence: 0.75

# documentation
- Number and track planned implementation steps as todos with status and a short activeForm summary, updating them as work progresses. Confidence: 0.6
- Label implementation phases in assistant messages as "T{n}" corresponding to the numbered plan. Confidence: 0.4

# workflow
See [workflow/taste.md](workflow/taste.md)
# ui
See [ui/taste.md](ui/taste.md)
# business-rules
- Unpaid/unconfirmed transactions (e.g., QRIS "Belum Dibayar") must not count as sales revenue in reports, dashboard, charts, or PDF, and stock should only be deducted once payment is confirmed — not when the transaction is created. Confidence: 0.75
- Analytics thresholds must be calibrated to realistic warung/small-shop sales volumes (e.g., inventory velocity: Laris ≈ ≥1 unit/day or 30+/month, Normal ≈ ≥1/3 unit/day or 10+/month), not generic large-retail benchmarks — unrealistically high cutoffs make filters and insights silently return empty and are reported as bugs. Confidence: 0.5
- After a transaction is saved/completed, the cart must be automatically cleared (items plus recovery data) so the next transaction starts fresh — purchase-item data from a completed transaction must not linger. Confidence: 0.6
- Saved transaction drafts must be deleted once consumed — delete immediately upon resume into the cart (best-effort, without blocking the restore) so a draft can never be resumed twice or linger as stale data after the transaction completes. Confidence: 0.65
- Date bucketing (today/yesterday/previous-period) must use local-time helpers (e.g., getTodayISO()/getDateOffsetISO()), never UTC `new Date().toISOString().slice(0,10)` — in UTC-positive timezones (Indonesia is UTC+7) the UTC slice shifts the day, misassigning sales to the wrong date; this is treated as a core business rule, not a style nit. Store transaction/expense dates as normalized local YYYY-MM-DD at creation and group via a format-tolerant helper (toDateKey) — mixing full ISO timestamps with date keys silently zeroes out date-bucketed charts (Sales Trend rendered no line). Confidence: 0.8

# code-quality
- Avoid re-implementing a rule/notification that another component already owns — one component is the single source of truth (e.g., the top-bar bell generates daily-summary notifications; pages must not duplicate that logic or notifications get double-added). Confidence: 0.5
- Separate a subsystem's responsibilities into focused, reusable modules (e.g., a printer connection manager, an ESC/POS byte-stream renderer, a pure text-layout formatter, and a job orchestrator) instead of one monolithic utility. Confidence: 0.6
- Prefer self-contained/vendored implementations over adding new npm dependencies when feasible (keeps the app lean, works offline/PWA, no build weight) — e.g., a vendored pure-TypeScript QR generator was chosen over an npm package. Confidence: 0.5
 than only restyling. Confidence: 0.7
- Confirmed design direction for this app: full-app visual overhaul, light theme only (no dark mode), keep hamburger-drawer navigation (no bottom nav bar). Confidence: 0.7

# offline
- Offline-first is a hard product requirement: the app must keep working without a network connection (offline sales, automatic synchronization, data recovery) — users should never lose a sale because of network issues. Confidence: 0.6

# product-vision
- Platform vision includes multi-user roles & permissions (owner/manager/cashier) gating access to reports, settings, capital, expenses, and destructive actions; treat as architectural direction even if implemented in a later phase. Confidence: 0.5
- Confirmed product directions from the approved Tier-1 plan: a global search command palette (products by name+barcode, customers, transactions by receipt #, expenses, capital) opened from the top bar or "/" shortcut; inventory analytics (30-day sales-velocity Laris/Normal/Lambat/Tidak Laku, days-of-stock, suggested reorder qty); and an in-app rule-based notifications center (low stock, overdue kasbon, daily summary) with a bell + persisted read-state. Confidence: 0.6

# ui
See [ui/taste.md](ui/taste.md)
# business-rules
- Unpaid/unconfirmed transactions (e.g., QRIS "Belum Dibayar") must not count as sales revenue in reports, dashboard, charts, or PDF, and stock should only be deducted once payment is confirmed — not when the transaction is created. Confidence: 0.75
0.75


# ui
See [ui/taste.md](ui/taste.md)
# business-rules
- Unpaid/unconfirmed transactions (e.g., QRIS "Belum Dibayar") must not count as sales revenue in reports, dashboard, charts, or PDF, and stock should only be deducted once payment is confirmed — not when the transaction is created. Confidence: 0.75
0.75
dence: 0.75
0.75
paid/unconfirmed transactions (e.g., QRIS "Belum Dibayar") must not count as sales revenue in reports, dashboard, charts, or PDF, and stock should only be deducted once payment is confirmed — not when the transaction is created. Confidence: 0.75
0.75
dence: 0.75
0.75
