# CarOS — Phase 1

> **Your car. Its entire story.**

CarOS is a premium, mobile-first automotive web app that combines two products:

- **CarProof** — a digital vehicle passport: maintenance, repairs, mileage, expenses and documents.
- **Mechanic AI** — an automotive assistant that reasons from each vehicle's own history.

Phase 0 built the complete frontend prototype. **Phase 1 adds a Supabase backend**:
real authentication, user profiles, and a vehicle garage backed by Postgres.

The app runs in one of two clearly-labelled modes:

| Mode | When | Data |
| --- | --- | --- |
| **Live** | `VITE_SUPABASE_URL` + anon key are set **and** you are signed in | Your real Supabase rows |
| **Demo** | No credentials, or signed out | Egyptian sample data in `localStorage` |

A banner in the app always states which one is active. The two sets are never
merged. See [docs/PHASE_1.md](docs/PHASE_1.md) for the backend details.

Mechanic AI, documents, maintenance history, notifications and expenses remain
demo-only and are labelled as such — see the table further down.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run typecheck  # TypeScript only
npm test           # unit tests (Vitest)
```

Screenshots of all 11 screens live in [`docs/screenshots`](docs/screenshots).

---

## Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 18 + TypeScript (strict) |
| Build | Vite 6 |
| Styling | Tailwind CSS 3, custom design tokens |
| Routing | React Router 6 (route-level code splitting) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| i18n | i18next + react-i18next (EN/AR, full RTL) |
| Backend | Supabase (Postgres + Auth) with Row Level Security |
| Server state | TanStack Query |
| Tests | Vitest + a Puppeteer smoke suite |

No other runtime dependencies were added.

---

## Screens (all 11 implemented)

| # | Screen | Route | Notes |
| --- | --- | --- | --- |
| 1 | Landing | `/` | Hero, CarProof, Mechanic AI, how it works, benefits, CTA, footer |
| 2 | Login / Register | `/login` | Tabs, validation, password toggle, forgot-password, Google placeholder |
| 3 | Dashboard | `/app` | Primary vehicle, mileage, maintenance status, upcoming, repairs, expenses, quick AI/passport access |
| 4 | My Garage | `/app/garage` | Cards, search, add/edit/delete, primary selection, empty + no-match states |
| 5 | Vehicle details | `/app/garage/:vehicleId` | Specs, engine, transmission, fuel, mileage, history, shortcuts |
| 6 | CarProof | `/app/carproof` | Timeline, repairs, mileage history, parts, expenses, documents, verification, export |
| 7 | Documents | `/app/documents` | Invoices/reports, categories, search, filters, upload + preview, file info, delete |
| 8 | Mechanic AI | `/app/ai-mechanic` | Demo chat, vehicle context, suggestions, image attach, diagnostic cards, urgency, history |
| 9 | Maintenance | `/app/maintenance` | Upcoming/overdue/completed, mileage & date schedules, checklist, add event, costs |
| 10 | Notifications | `/app/notifications` | 4 types, read/unread, mark all, delete, settings shortcut |
| 11 | Settings | `/app/settings` | Profile, language, theme, notifications, vehicle prefs, privacy, security, logout |

Plus a 404 page.

---

## Architecture

```
src/
├── components/
│   ├── layout/       Logo, Sidebar, Topbar, BottomNav, PageHeader, DemoNotice
│   └── ui/           Button, Card, Badge, Modal, Field, Toggle, Tabs, States,
│                     Avatar, Progress, StatusPill, VerificationBadge,
│                     charts/ (AreaChart, BarList, Donut)
├── features/
│   ├── ai/           demoEngine, ChatBubble, DiagnosticCard
│   ├── carproof/     TimelineItem
│   ├── dashboard/    VehicleHeroCard, MaintenanceStatusCard, UpcomingServices,
│   │                 RecentRepairs, ExpensesCard, QuickActions
│   ├── documents/    UploadDocumentModal
│   ├── maintenance/  AddMaintenanceModal
│   └── vehicles/     VehicleCard, VehicleFormModal, DeleteVehicleModal, VehicleSwitcher
├── pages/            the 11 screens + NotFound
├── layouts/          AppLayout (sidebar + topbar + mobile bottom nav)
├── hooks/            useLanguage, useLocalized, useToast, useMediaQuery
├── lib/              store.tsx (single demo state source), storage.ts, supabase.ts (seam)
├── i18n/             index.ts, en.ts, ar.ts
├── data/             mockData.ts (shared demo layer)
├── types/            domain types
└── utils/            format.ts (EGP/km/dates), vehicle.ts, cn.ts
```

**One shared mock data layer** (`src/data/mockData.ts` + `src/lib/store.tsx`) feeds the
dashboard, garage, passport, maintenance, documents and notifications, so switching a
vehicle or adding a record stays consistent everywhere.

---

## Design system

| Token | Value |
| --- | --- |
| Main background | `#090B0F` |
| Secondary background | `#12161D` |
| Card background | `#191E27` |
| Primary accent | `#C6FF3D` |
| Primary text | `#F5F7FA` |
| Secondary text | `#9199A8` |
| Borders | `#2B323D` |

Dark premium theme, Inter + IBM Plex Sans Arabic, rounded cards, subtle glass, and
micro-interactions. Desktop uses a persistent sidebar; mobile uses a five-item bottom
bar plus a "More" sheet. All motion respects `prefers-reduced-motion`.

---

## Arabic & English

- Full `en` / `ar` dictionaries with key-parity enforced by a test.
- `<html dir>` and `lang` switch together; layout uses logical properties
  (`ms-*`, `pe-*`, `start/end`) so RTL mirrors correctly.
- Directional icons flip via `.rtl-flip`.
- Language persists in `localStorage` (`caros.language`) **and** settings, so it survives reload.
- Arabic plural categories (zero/one/two/few/many/other) have real Arabic forms.
- Numbers, dates and currency use Western digits in Arabic on purpose: plates, VINs
  and invoices are cross-checked against physical documents.
- Arabic typography drops uppercase tracking labels, which read badly in Arabic script.

---

## Demo data

- **Hyundai Elantra 2018** (primary) — 128,450 km, 7 records, 6 documents
- **Toyota Corolla 2022** — 41,200 km, 4 records
- **Kia Sportage 2021** — 86,500 km, 5 records

Workshops (El-Sherif Auto Center, Toyota Egypt Abbassia, Kia Sheikh Zayed, Bridgestone),
EGP invoices, plate numbers and inspection centres are all Egyptian. Everything is
labelled "Demo data" in the UI.

---

## Demo-only functionality (explicit)

| Area | What is real | What is simulated |
| --- | --- | --- |
| Auth | Form validation, password toggle, forgot flow UI | No account is created, no request is sent |
| Google login | Button + visual placeholder | Nothing happens except an explanatory toast |
| Mechanic AI | Intent detection over your real demo records, chat, attachments UI | Replies are pre-written samples; **no** AI API, **no** confidence scores |
| Documents | Upload, validation, preview, delete within the session | Files stay in browser memory and are lost on reload |
| Export report | Button, loading state, toast | No PDF is generated |
| Theme "Light" | Preference is stored | Light palette is a preview only; the product is designed dark |
| Persistence | Vehicles, records, documents, notifications, chats, profile, settings | Browser `localStorage` only — **not** secure cloud storage |
| Privacy/security | Toggles + copy | No backend exists yet |

Reset everything from the dashboard notice or Settings → Reset demo data.

---

## Test results

```
npm run typecheck   → 0 errors
npm run build       → success, no size warnings
npm test            → 16/16 passing
  tests/i18n.test.ts   (5)  EN/AR key parity, no empty strings, natural Arabic
  tests/utils.test.ts (11) currency/number/date helpers, maintenance health, data integrity
scripts/smoke.mjs    → 0 failures, 0 runtime errors
```

The Puppeteer smoke suite (`scripts/smoke.mjs`) walks all 11 routes at 1440px and
390px, checks every route in Arabic (`dir=rtl`, `lang=ar`, Arabic heading), asserts no
horizontal overflow, then exercises adding a vehicle and sending a Mechanic AI message.
Regenerate screenshots with `scripts/screenshot.mjs`.

### Backend (Phase 1)

```bash
# 1. apply the schema
supabase link --project-ref <ref> && supabase db push
#    …or paste supabase/migrations/*.sql into the SQL Editor in order

# 2. configure the client
cp .env.example .env.local   # then fill in URL + anon key

# 3. verify policies (needs a real project)
psql "$DATABASE_URL" -f supabase/tests/rls_security_test.sql
```

Full instructions, the RLS policy rationale and the honest status of each
feature are in [`docs/PHASE_1.md`](docs/PHASE_1.md).

### Known issues

1. **Theme "Light" is a stored preference without a full palette.** The product is
   designed dark; a light theme would need its own colour pass.
2. **Documents are not persisted.** Uploads live in memory for the session only, by design.
3. **Report export is a placeholder.** No PDF generation yet.
4. **No ESLint config.** To keep the dependency set minimal, linting is covered by
   TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`) plus the test suites.
   Adding ESLint is a small follow-up if the team wants it.
5. **Images are AI-generated stand-ins**, not photographs of the exact trim levels.
6. **i18n uses `ar-EG-u-nu-latn` formatting deliberately** (see above); this is a product
   decision, not localisation drift.

---

## Preparing for Phase 1 (Supabase)

The seam already exists:

- `src/lib/supabase.ts` reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and reports
  `IS_BACKEND_CONNECTED = false`.
- `.env.example` documents the two variables.
- All reads/writes funnel through `src/lib/store.tsx`, so replacing `localStorage` with
  Supabase queries is a contained change (vehicles, records, documents, notifications,
  chats, profile, settings).
- `src/types/index.ts` already models the rows you would create.

No secret is committed, and nothing is deployed automatically.
