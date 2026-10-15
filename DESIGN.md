---
name: Warung Resoyudan
description: A fast, warm point-of-sale and bookkeeping app for a corner kiosk owner.
colors:
  counter-blue: "#2563eb"
  emerald-primary: "#059669"
  sunset-primary: "#ea580c"
  royal-primary: "#7c3aed"
  rose-primary: "#e11d48"
  ruby-primary: "#dc2626"
  paper: "#f8fafc"
  card: "#ffffff"
  ink: "#0f172a"
  ink-muted: "#475569"
  line: "#e2e8f0"
  container-low: "#f1f5f9"
  container: "#e9eef5"
  container-high: "#e2e8f0"
  surface-tint: "#2563eb"
  success: "#16a34a"
  warning: "#d97706"
  danger: "#dc2626"
  info: "#2563eb"
  error: "#ba1a1a"
typography:
  display:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.33
  title:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.43
  caption:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.33
  overline:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.27
    letterSpacing: "0.08em"
  numeric-display:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.27
rounded:
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  touch-target: "48px"
  gutter: "16px"
  container-padding: "20px"
  stack-gap: "12px"
components:
  button-primary:
    backgroundColor: "{colors.counter-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "48px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  chip-active:
    backgroundColor: "{colors.counter-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "48px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "20px"
  list-row:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "16px"
  kpi-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge-success:
    backgroundColor: "rgba(22,163,74,0.1)"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    height: "24px"
  badge-warning:
    backgroundColor: "rgba(217,119,6,0.1)"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    height: "24px"
  badge-danger:
    backgroundColor: "rgba(220,38,38,0.1)"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    height: "24px"
  badge-info:
    backgroundColor: "rgba(37,99,235,0.1)"
    textColor: "{colors.info}"
    rounded: "{rounded.full}"
    height: "24px"
---

# Design System: Warung Resoyudan

## Overview

**Creative North Star: "The Corner Kiosk"**

Warung Resoyudan is built like the counter of a well-run neighborhood warung: warm and approachable on the surface, but every tap lands exactly where the owner expects. The design reads as a friendly helper behind the counter — bright paper surfaces, a single confident accent color, soft corners, and type that speaks plainly. Nothing is decorative for its own sake; everything exists so a sale can be recorded in seconds while a customer waits.

The system's philosophy is **warm efficiency**. Forms are soft and tactile (rounded corners, gentle shadows, generous touch targets) so the interface feels physically forgiving during a busy day, while hierarchy stays sharp so the owner never hunts: one obvious action per screen, statuses told in constant colors, money always in bold tabular figures. Density is comfortable and mobile-first — built for one hand on a phone, scaling to a tablet counter terminal without losing rhythm.

Depth is expressed softly. Cards sit on the page with whisper-light shadows and a tonal surface ramp; the accent color is used freely enough to keep the screen alive, but always as the signal for *action*. Status colors never change with the theme — a debt stays amber and an out-of-stock stays red no matter which palette the owner picks, because those meanings are universal.

**Key Characteristics:**
- Mobile-first, one-hand operational: 48px touch targets and sticky action bars throughout.
- Soft, tactile forms: 8–24px radius scale, warm corner language, gentle ambient shadows.
- One type family (Hanken Grotesk), hierarchy by weight and size, not by font switch.
- A single accent color per theme carries every action; status colors are theme-independent constants.
- Money is always bold and tabular; every figure reads like a ledger line.
- Real-data honesty: surfaces treat live Firestore data as the only truth; empty states guide, never fake.

## Colors

The palette is a set of coherent "paper and ink" light themes. Each theme swaps one accent family while keeping the same neutral scaffold, so the app re-colors instantly without any layout change. Status colors are frozen across every theme.

### Primary
- **Counter Blue** (#2563eb): The default action color. Primary buttons, active chips, selected payment methods, links, focus rings, the checkout bar, and the FAB glow. White text on top at all times (AA 4.5:1).
- **Counter Blue Tint** (#dbeafe): The primary's container. Soft selection backgrounds, selected states, and tinted highlights behind primary actions.

### Secondary (Theme Accents)
Each theme swaps in an alternate accent family that plays the exact same role as Counter Blue. The owner picks one; the app never mixes them.
- **Kiosk Emerald** (#059669): Fresh and stable; the "segara and productive" alternative.
- **Kiosk Sunset** (#ea580c): Warm and energetic; a sunny, friendly register.
- **Kiosk Royal** (#7c3aed): Premium and composed.
- **Kiosk Rose** (#e11d48): Gentle and warm.
- **Kiosk Ruby** (#dc2626): Bold and confident.

Each theme carries a matching `*-container` tint (e.g. emerald #d1fae5) and a `*-shadow-fab` glow for floating buttons.

### Neutral
- **Kiosk Paper** (#f8fafc): The app background — cool, clean slate.
- **Kiosk Card** (#ffffff): Cards, popovers, dialogs, inputs — every elevated surface is pure white.
- **Kiosk Ink** (#0f172a): Primary text, headings, strong labels.
- **Kiosk Ink Muted** (#475569): Secondary text, subtitles, placeholders, captions.
- **Kiosk Line** (#e2e8f0): Borders, dividers, hairline edges around cards and inputs.
- **Surface Container Ramp** (#f1f5f9 → #e9eef5 → #e2e8f0): Low, base, and high container surfaces used for subtle tonal layering (quantity controls, icon tiles, hover fills, muted panels).
- **Surface Tint** (#2563eb): The system chrome tint, synced to the active theme's primary.

### Status (Constant)
- **Kiosk Success** (#16a34a): Paid, lunas, in stock, healthy.
- **Kiosk Warning** (#d97706): Debt, unpaid, low stock.
- **Kiosk Danger** (#dc2626): Overdue, out of stock, destructive actions.
- **Kiosk Info** (#2563eb): Neutral-informational badges.
- **Kiosk Error** (#ba1a1a) with its container (#ffdad6): Validation and destructive messaging.

### Named Rules
**The Constant-Signals Rule.** Status colors never ride the theme. A debt is amber and an out-of-stock is red in every palette, because the owner must read the store's health at a glance without relearning colors.

**The One-Accent Rule.** Each screen reads through a single accent color from the active theme. Never introduce a second hue for decoration; extra hues belong to status and charts only.

**The Paper-Under-Ink Rule.** Text never sits directly on a colored background except white-on-accent for actions. Secondary text is Kiosk Ink Muted on Paper or Card, never a mid-gray on a mid-gray.

## Typography

**Display / Body Font:** Hanken Grotesk (with ui-sans-serif, system-ui fallbacks)

**Character:** A single, friendly grotesque family carries the whole system. Hierarchy is built by weight (700 → 600 → 500 → 400) and size, never by font switch. The face is warm and modern without personality noise — it reads fast on a small screen and stays legible in dim shop light.

### Hierarchy
- **Display** (700, 30px/1.2, -0.02em): Rarely used; large totals and hero headlines only.
- **Headline** (700, 24px/1.33): Page titles, dialog titles, section headers, card titles.
- **Title** (700, 20px/1.2): Product prices on cards, metric labels at large.
- **Body** (400, 16px/1.5): Default reading text, list titles (semibold when titles), input values.
- **Label** (600, 14px/1.43): Buttons, field labels, nav items, active chip text.
- **Caption** (500, 12px/1.33): Helper text, unit prices, footers, stock counts.
- **Overline** (600, 11px/1.27, 0.08em uppercase): KPI card labels, eyebrow text, nav group headers.
- **Numeric Display** (700, 22px/1.27): Large money figures, always paired with tabular numerals.

### Named Rules
**The Money-Line Rule.** Every currency figure uses bold weight and tabular numerals (`tabular-nums`), so columns of prices line up and scan like a ledger.

**The Weight-Only Rule.** Never swap families for emphasis. Emphasis is weight (700/600) and size — a single family keeps the counter fast to read.

## Layout

The layout is mobile-first and one-hand friendly, then widens to a tablet counter terminal.

- **Content container:** Centered `max-w-7xl` with `px-4` gutter (16px) on mobile, `px-6` (24px) on `sm+`. Standard pages pad below for the bottom nav (`pb-24`).
- **Kasir is full-bleed:** The cashier surface drops the app bar and container padding on mobile — it's a dedicated `h-dvh` checkout experience with the product grid on top and a floating cart bar pinned to the bottom.
- **Product grid:** 2 columns on mobile → 3 on `sm` → 4 on `xl`, with 12–16px gaps. Product cards are stacked, image-first.
- **Tablet cart split:** On `md+` the kasir page becomes a two-pane register — product grid (`flex-[3]`) on the left, a live cart panel on the right. On mobile the cart is a drawer.
- **Bottom navigation:** 5 most-used routes, fixed, 64px tall, icon + label, on mobile only.
- **Top app bar:** Fixed, 48px tall (h-12), hairline bottom border, blurred translucent surface.
- **Spacing rhythm:** `--gutter` 16px page gutter; card padding 20px; list rows 16px; stack gap 12px; section gaps 16–20px. Comfortable, never cramped.
- **Touch targets:** Minimum 48px on every tappable primary path (buttons, nav items, quantity controls, rows). Secondary inline actions stay ≥ 36px.

### Named Rules
**The 48-Pixel Floor Rule.** Any control a customer-facing flow depends on is at least 48px tall and wide. One-hand operation is a product promise, not a nicety.

## Elevation & Depth

Elevation is a hybrid of **soft ambient shadows** and **tonal layering** — the kiosk reads as calm and physical, never as a dramatic floating UI.

- Cards, list rows, dialogs, and the bottom bar sit on whisper-light shadows (`0 1px 2px rgba(0,0,0,0.04)` at rest), rising slightly on hover (`0 4px 6px -1px rgba(0,0,0,0.05)`).
- Depth also comes from the surface-container tonal ramp: quantity controls, icon tiles, and filled hover states use container tones instead of shadows, keeping the page flat by default and layered where it matters.
- The floating cart bar and FABs carry a colored glow (`0 8px 16px -4px <accent>/25`) that ties the "lift" to the brand accent.
- Dialogs and bottom sheets are the highest elevation, using `shadow-xl` and a full backdrop.

### Shadow Vocabulary
- **Card Rest** (`0 1px 2px 0 rgb(0 0 0 / 0.04)`): Every card, list row, chart card at rest.
- **Card Hover** (`0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.04)`): Interactive cards under pointer.
- **FAB Glow** (`0 8px 16px -4px <accent-tint>/25`): Floating cart bar, scan FAB, and primary floating actions.
- **Dialog** (`0 20px 25px -5px rgb(0 0 0 / 0.07), 0 8px 10px -6px rgb(0 0 0 / 0.04)`): Dialogs, bottom sheets, select popovers.

### Named Rules
**The Ambient-Only Rule.** Shadows signal rest and slight lift, never depth drama. No hard or wide dark shadows anywhere; when something must feel deeper, raise the tonal layer instead.

## Shapes

The form language is **soft and tactile**: generous rounding with a clear hierarchy of "pill for state, rectangle for action."

- **Radius scale:** xs 8px (small chips) · sm 10px · md 12px (buttons, inputs, selects, icon tiles) · lg 16px (cards, list rows, dialogs, sheets) · xl 20px (FABs, product image surfaces) · 2xl 24px (bottom-sheet top corners).
- **Pills** (`9999px`) are reserved for states and selection: status badges, category chips, period filters, quick-quantity chips, and the favorite marker on product images.
- **Actionable controls** (buttons, inputs, payment method tiles, list rows, cards) use the 12–16px band — rounded but with enough corner to read as a button, not a pebble.
- **Icon tiles:** KPI icon squares are 40px with `rounded-md`; the empty-state icon sits in a 64px full circle tinted with the accent at 10%.
- Hairline borders (`1px Kiosk Line`) frame every card, input, chip, and row; selected states swap the border for the accent and add a soft 4px focus ring.

### Named Rules
**The Pill-For-One Rule.** Pill shapes mean "this is a state or a filter." Anything that performs an action is a rounded rectangle. A pill that triggers a flow, or a rectangle used as a status tag, breaks the grammar.

## Components

### Buttons
- **Shape:** Rounded rectangles at `rounded-md` (12px); primary actions 48px tall.
- **Primary:** Filled accent, white semibold 14px label, optional leading icon, colored glow shadow. Hover darkens ~10%; press scales to 0.98. Used once per view as the decisive action ("Simpan Transaksi", "Konfirmasi & Bayar").
- **Outline:** `1px` Kiosk Line on white card, ink text; used for secondary actions and the empty-cart scan affordance (2px accent outline variant for high emphasis).
- **Ghost / Icon:** Transparent, ink text/icon, 48px hit area; used in app bars, toolbars, and row actions (delete in danger red).
- **Touch states:** `active:scale` press feedback plus hover fills; focus shows a 3–4px accent ring at 15–50% opacity.

### Chips
- **Style:** Pills, 48px tall when interactive, `px-4 py-2`, 14px medium label.
- **State:** Unselected = white card + 1px Line border + ink-muted text; selected = filled accent + white text + card shadow. Used for category filters on the kasir header, period filters on Dashboard/Laporan, and ×1/×2/×5 quick quantities in the cart.

### Cards / Containers
- **Corner Style:** `rounded-lg` (16px).
- **Background:** Pure white (`#ffffff`) on Kiosk Paper; hairlined with Kiosk Line.
- **Shadow Strategy:** Card Rest at rest; Card Hover when interactive. Tonal container surfaces fill non-card panels.
- **Internal Padding:** 20px (standard) / 16px (compact rows, `Card` `sm` size).
- **Structure:** Chart cards use a title row (bold 20px title + optional legend/actions) above content; KPI cards stack an overline label, a bold tabular value, and an optional caption.

### Inputs / Fields
- **Style:** 48px tall, `rounded-md` (12px), white fill on paper, `1px` Kiosk Line stroke, 16px text, ink-muted placeholder.
- **Focus:** Border shifts to the accent with a 4px accent ring at 15% — a soft glow, not a hard outline.
- **Adornments:** Leading/trailing icons (search, currency) sit inside the field at 16px, aligned to the text baseline.
- **Error / Disabled:** Error swaps border+ring to danger; disabled fades to 50% with a muted fill.

### Badges / Status Pills
- **Style:** 24px-tall full pills, tinted background at 10% of the status color, colored semibold 12px label.
- **Semantics (constant):** success = paid/lunas/available; warning = debt/unpaid/low stock; danger = overdue/out of stock; info = neutral-informational. Used on transactions, product stock, kasbon status, and receipt states.

### Navigation
- **Top App Bar:** 48px fixed bar, translucent blurred Paper, hairline bottom border. Hamburger left, page title, and notification/search/account actions right — each a 48px square icon button.
- **Bottom Nav (mobile):** 64px fixed bar, 5 routes, icon + caption label; active item is accent-colored with semibold label; active row fill on press.
- **Side Drawer (desktop & overlay):** 280px left sheet, store mark tile (accent square + white store icon), app name + "Kiosk Assistant" eyebrow, then a Menu group of 11 rows — active row is accent-tinted text with the icon, inactive rows are ink-muted with a container-high hover fill.

### List Rows
- **Style:** 16px-padded white cards, `rounded-lg`, hairline border, shadow-card at rest; chevron affordance on tappable rows.
- **Layout:** optional leading tile, title (semibold 16px) + subtitle (muted 14px), right-aligned trailing value; press scales to 0.99.

### Product Card (Signature)
- The kasir product tile: square image surface (`rounded-md` on container tone) with a category caption, a 2-line clamped product name, and a bold accent-hued price beside a stock count.
- **Favorite marker:** a 28px full circle amber badge with a white star on the image's top-left.
- **Stock badges:** bottom-right over the image — "Habis" (danger) or "Stok Tipis" (warning).
- **Add behavior:** tapping the card or its "Tambah" button fires the flying-ball animation — a branded ball arcs into the cart bar/panel — plus a quick pop-and-check pulse on the card. This is the system's signature delight.

### Cart Bar (Signature)
- Mobile: a floating, full-width bar pinned above the bottom edge, elevated with the accent glow. Left shows the cart icon with a danger count bubble and an item count; right shows the bold accent total plus a chevron. The bar bounces when an item is added; the count bubble pulses.

### Dialog / Bottom Sheet
- Dialogs: centered, `max-w` (up to 480–512px), white card, `rounded-lg`, hairline border, `shadow-dialog`, a faint blurred backdrop, and a close ghost button top-right. Persistent dialogs (checkout, confirmations) ignore backdrop taps to protect a half-finished sale.
- Bottom sheets: 24px top corners, used for the mobile cart and quick actions.

### Empty States
- A 64px accent-tinted circle icon, a bold headline, and a one-line muted description, optionally with a primary CTA. Empty states always say *what to do next*, never just "no data."

### Charts
- Trend lines use the theme's chart sequence (5 harmonious tones). Donut charts reserve success for profit share and warning for the rest. Chart cards reuse the standard title-row card structure.

## Do's and Don'ts

### Do:
- **Do** ship exactly one primary action per screen, filled with the accent (e.g. "Simpan Transaksi", "Konfirmasi & Bayar").
- **Do** keep status signals in the constant palette — success/warning/danger survive any theme switch.
- **Do** make every primary touch target at least 48px; treat the kasir flow as the measure of the whole system.
- **Do** set money in bold tabular numerals; totals on the checkout path get the accent color.
- **Do** reserve pills for states and filters, rounded rectangles for actions.
- **Do** use the accent glow (`0 8px 16px -4px <accent>/25`) for floating action bars and FABs.
- **Do** keep the surface tonal ramp for depth whenever a shadow would be too heavy.

### Don't:
- **Don't** mix theme accents — one palette per app, always.
- **Don't** use the accent as a decorative fill on read-only content; accent means *action*.
- **Don't** add hard or wide dark shadows; depth is ambient and tonal.
- **Don't** switch fonts for emphasis — weight and size only.
- **Don't** re-theme status colors; a debt is amber and an out-of-stock is red in every theme.
- **Don't** render money without tabular numerals, or totals without bold weight.
