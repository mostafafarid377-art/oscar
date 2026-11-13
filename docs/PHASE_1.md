# CarOS — Phase 1: Supabase, Authentication & Vehicle Garage

Phase 0 is unchanged visually. This document covers the backend work only.

---

## 1. What changed

### New files

| Path | Purpose |
| --- | --- |
| `supabase/migrations/20261112000001_extensions_and_helpers.sql` | `pgcrypto`, `set_updated_at()` trigger helper |
| `supabase/migrations/20261112000002_profiles.sql` | `profiles` table + auto-provision trigger on signup |
| `supabase/migrations/20261112000003_vehicles.sql` | `vehicles` table, indexes, primary-vehicle partial unique index, ownership-guard trigger |
| `supabase/migrations/20261112000004_vehicle_members.sql` | `vehicle_members`, role enum, ownership/membership helper functions, escalation guard |
| `supabase/migrations/20261112000005_rls_policies.sql` | RLS enablement + all policies + column-level grants |
| `supabase/migrations/20261113000001_atomic_primary_vehicle.sql` | Transactional, owner-authorized primary vehicle promotion RPC |
| `supabase/tests/rls_security_test.sql` | 20-assertion RLS suite using two real users |
| `src/lib/supabase/client.ts` | Supabase client, config reader, service-role-key guard |
| `src/lib/supabase/mappers.ts` | Row ↔ domain mapping |
| `src/lib/dataSeparation.ts` | Pure demo/live separation rules (unit tested) |
| `src/lib/queryClient.ts` | TanStack Query client |
| `src/types/database.ts` | Typed schema mirror |
| `src/features/auth/AuthProvider.tsx` | Session, signup/login/logout/reset, profile CRUD |
| `src/features/auth/ProtectedRoute.tsx` | Route guard with demo fallback |
| `src/features/vehicles/api/vehiclesApi.ts` | Vehicle CRUD against Supabase |
| `src/features/vehicles/api/useVehicles.ts` | TanStack Query hooks |
| `src/components/layout/DataSourceNotice.tsx` | Always-visible live/demo indicator |
| `tests/auth.test.ts` | 12 tests: key detection, row mapping |
| `tests/dataSeparation.test.ts` | 9 tests: demo/live isolation |

### Modified files

`package.json` (deps) · `vite.config.ts` (vendor chunks) · `src/main.tsx` (providers) ·
`src/App.tsx` (guard) · `src/lib/store.tsx` (dual source) · `src/lib/supabase.ts` (real client) ·
`src/lib/storage.ts` (dataSource key) · `src/pages/LoginPage.tsx` (real auth) ·
`src/pages/GaragePage.tsx` (loading/error) · `src/pages/SettingsPage.tsx` (profile sync) ·
`src/features/vehicles/VehicleFormModal.tsx` (async + errors) ·
`src/features/vehicles/DeleteVehicleModal.tsx` (async + errors) ·
`src/layouts/AppLayout.tsx` (notice) · `src/i18n/{en,ar}.ts` (new keys) ·
`src/types/database.ts` · `.env.example`

---

## 2. Environment setup

```bash
cp .env.example .env.local
```

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon publishable key>
```

Get both from **Supabase → Project Settings → API**.

**The anon key is safe in a browser bundle** — RLS is the security boundary, not
key secrecy. The client will *refuse to start* if the key's `role` claim is
`service_role`, because shipping that key would bypass every policy.

Without these values the app runs in **demo mode**, exactly as in Phase 0.

---

## 3. Supabase configuration

### Apply migrations

**Dashboard:** open the SQL Editor and run each file in
`supabase/migrations/` in filename order.

**CLI:**
```bash
supabase link --project-ref <project-ref>
supabase db push
```

### Authentication settings

**Authentication → Providers → Email:**
- Enable Email provider.
- **Confirm email: ON** — required for the verification flow to be meaningful.

**Authentication → URL Configuration:**
- Site URL: `http://localhost:5173` (dev) or your deployed origin.
- Redirect URLs: add `http://localhost:5173/login` and your deployed
  `https://<host>/login`.

### Google (optional)

Not implemented. The button remains a labelled placeholder. To activate later:
enable the Google provider, then swap the placeholder handler for
`supabase.auth.signInWithOAuth({ provider: 'google' })`.

---

## 4. Status

### Authentication — implemented, not verified against a live project

| Feature | Status |
| --- | --- |
| Email registration | Implemented (`signUp`, full name → user metadata → profile trigger) |
| Email verification | Implemented (confirmation screen + resend) |
| Email/password login | Implemented |
| Logout | Implemented (clears session, falls back to demo) |
| Password reset | Implemented (email link → recovery screen → `updateUser`) |
| Session restoration | Implemented (`getSession` + `onAuthStateChange`, PKCE) |
| Protected routes | Implemented (`ProtectedRoute`, loading state, redirect) |
| Error handling | Implemented (Supabase messages → i18n keys, EN + AR) |
| Google sign-in | **Placeholder only**, as required |

### Vehicle garage — implemented, not verified against a live project

Add · edit · delete (confirm) · set primary · switch · search · empty state ·
loading state · error state. Zod validation preserved.

> **Not verified live:** no Supabase project credentials were available in this
> environment, so no request has ever reached a real database. Every behaviour
> above is covered by unit tests and by UI-level tests against a stubbed
> "configured" state, but **end-to-end persistence is unproven**.

---

## 5. How demo and production data are kept apart

Three independent guards:

1. `resolveDataSource()` returns `demo` unless credentials exist **and** a
   session is active. Demo is the safe default.
2. `visibleForSource()` filters records/documents down to rows whose
   `vehicleId` is a real Supabase vehicle. A brand-new car therefore shows an
   **empty** history, never the sample Elantra's oil changes.
3. `DataSourceNotice` always states which source is on screen and offers an
   explicit switch.

Sample vehicles are never uploaded to a real account.

---

## 6. Security notes

- **RLS on every table.** No table is readable without a matching policy.
- **Ownership is immutable.** `owner_id` is excluded from the column-level
  `UPDATE` grant *and* guarded by a trigger.
- **No client INSERT on `profiles`.** Rows come only from a `SECURITY DEFINER`
  trigger, so a user cannot forge a profile for someone else.
- **Member escalation blocked.** A `BEFORE INSERT OR UPDATE` trigger rejects
  membership rows unless the caller owns the vehicle, and rejects an owner
  adding themselves.
- **RLS is not `FORCE`d** — deliberately. The two `SECURITY DEFINER` helpers
  are mutually referenced by the vehicles/vehicle_members policies; forcing RLS
  would make Postgres abort with "infinite recursion detected in policy".
  Client roles still go through RLS.
- **Search path pinned** on every `SECURITY DEFINER` function.

---

## 7. Known issues

1. **No live verification.** No credentials in this environment; see above.
2. **Vehicle photos are chosen from three bundled images**, not uploaded.
   `photo_url` exists in the schema for a future Storage bucket.
3. **No sharing UI.** `vehicle_members` and its policies exist and are tested,
   but nothing in the interface exposes them — per the brief.
4. **Profile fields beyond `full_name`** (phone, city) remain local-only; they
   are not columns in the schema.
5. **Recovery redirect assumes hash-free routing.** `detectSessionInUrl` is on,
   so the recovery token is consumed on load; the `?mode=recovery` marker then
   decides which screen to show.
