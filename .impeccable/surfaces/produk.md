---
version: 1
slug: "produk"
primary_target: "produk"
related_targets: []
---

# Surface Brief: Produk

**Visitor mode:** Operate

## 1. Job and audience

The warung owner, alone at the counter, mid-flow between sales. They arrive on Produk to keep inventory honest — a balanced workflow of browsing, checking price/stock, adding products (manual or scan), and quick stock bumps. Success is a glanceable inventory truth, not an analytics dashboard.

## 2. Outcome and proof

- At a glance: total products, low-stock count, inventory value, and which products are Laris/Lambat/Tidak Laku.
- One-tap paths: add (manual or scan), favorite, edit, delete, quick stock +1.
- Proof: the three KPI cards, search + filter chips, and velocity/reorder intelligence stay present.

## 3. Selected direction

The incumbent "The Corner Kiosk" world (DESIGN.md) is the authority — no new visual world. Refinement direction: **clean & scannable rows** with inventory smarts **available but subtle**. The table reads by product identity first (name + category + image), analytics second. Velocity moves from a first-class column into quiet secondary signals — a compact status badge and a one-line reorder hint. The one real open decision a builder must not invent: the exact mechanism for velocity/reorder (named column vs. tooltip/expandable) — resolved as subtle-and-secondary.

## 4. Scope and boundaries

- Fidelity: production-ready, responsive (phone card list, tablet table).
- In scope: decluttering the table, softening velocity presentation, tightening spacing and status signaling.
- Out of scope: new features, new routes, the add/edit/scan flows (already solid), destructive-action flows, anything outside the Produk surface.
- Anti-goals: no new accent hues, no fabricated claims, no changes that make the kasir or dashboard inconsistent.

## 5. States and ranges

Typical: tens to low-hundreds of products, searchable by name/barcode, filterable by Semua/Stok Menipis/Favorit/Laris/Lambat/Tidak Laku. Material states: loading skeletons, empty search/filter results, low-stock rows (danger), out-of-stock rows, offline sync indicator.

## 6. Interaction and layout

Mobile: summary KPIs → search → filter chips → card list, FAB bottom-right. Tablet: same header, then the table. Hierarchy by product identity, not by analytics. Velocity = compact status badge in the secondary row; reorder hint = small caption text; favorite star stays one-tap; quick-stock button stays adjacent but visually lighter.

## 7. Constraints and open decisions

Binding rules from DESIGN.md: The 48-Pixel Floor Rule, The Money-Line Rule, The Constant-Signals Rule (status colors), The One-Accent Rule. Reuse existing components (KPI card, SearchInput, StatusBadge, StockBadge, PageHeader) — do not rebuild. Localization: casual Indonesian as-is. Accessibility per PRD: ≥48px touch targets, clear contrast.

Open decisions a builder must not invent:
- Exact velocity/reorder mechanism (named column vs. tooltip/expandable) — resolved as subtle-and-secondary.
