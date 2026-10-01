# Rukun --- Frontend Plan (Draft 1)

> **Status:** Final implementation plan\
> **Frontend baseline:** Vue 3 + Vite + TypeScript\
> **Backend contract:** Rukun Backend / Core R melalui OpenAPI 3.1\
> **Target:** SPA/PWA mobile-first, satu codebase untuk warga, pengurus,
> vendor, dan system admin\
> **Prinsip:** karena repository frontend masih blank, foundation harus
> dibangun solid sebelum feature screen dikerjakan.

------------------------------------------------------------------------

## 1. Tujuan Frontend

Frontend Rukun harus melayani beberapa jenis pengguna tanpa membuat
aplikasi terpisah:

``` text
Rukun FE
├── Warga / Household
├── Pengurus RT/RW
├── Vendor
└── System Admin
```

Satu User dapat mempunyai beberapa assignment/scope sekaligus. UI tidak
boleh mengasumsikan satu User = satu role.

Contoh:

``` text
User Reza
├── Warga → Household H001
├── Bendahara RT → RT 03
└── Sekretaris RW → RW 05
```

User tetap mempunyai satu session authentication. Pergantian pekerjaan
dilakukan melalui **Context Switching**, bukan login ulang.

------------------------------------------------------------------------

## 2. Locked Technical Direction

### Core stack

``` text
Vue 3
Vite
TypeScript strict

PrimeVue 4 Styled Mode
Tailwind CSS 4

Vue Router
Pinia
TanStack Vue Query

PrimeVue Forms
Zod

Orval
Axios

vue-i18n
vite-plugin-pwa

Vitest
Playwright
```

Package manager dikunci ke **pnpm** dengan lockfile dan versi package
manager yang dipin.

PrimeVue memakai **Styled Mode** dengan **Aura** sebagai preset awal.
Tailwind digunakan untuk layout, responsive composition, dan styling
khusus Rukun.

Orval menghasilkan TypeScript client/types dan TanStack Vue Query
bindings dari OpenAPI 3.1 backend. Transport HTTP menggunakan satu
custom Axios instance.

### Deployment

Production target:

``` text
https://rukun.example/
├── /        → Vue SPA/PWA
└── /api     → Laravel API
```

Frontend dan API berada pada origin/domain yang sama melalui reverse
proxy.

### Language

Bahasa Indonesia menjadi default.

Frontend tetap disiapkan untuk translation key sehingga UI tidak
menyebarkan hardcoded copy di seluruh component.

------------------------------------------------------------------------

## 3. Frontend Architecture Principles

### 3.1 Backend remains authoritative

Frontend tidak menentukan:

-   permission;
-   scope;
-   invoice balance;
-   payment status;
-   allocation;
-   ledger state;
-   WiFi eligibility;
-   gallon balance;
-   accounting state.

Frontend mengirim intent dan menampilkan state dari server.

### 3.2 Server state ≠ client state

``` text
TanStack Query
└── server state
    ├── residents
    ├── households
    ├── invoices
    ├── payment submissions
    ├── cashbook
    ├── wifi
    ├── patrol
    └── dst.

Pinia
└── application/client state
    ├── authenticated user/session helper
    ├── available contexts
    ├── active context
    ├── UI preferences
    └── small cross-page transient state
```

Jangan menyalin seluruh API response ke Pinia.

### 3.3 Generated API contract

Frontend tidak membuat type request/response backend secara manual jika
sudah tersedia di OpenAPI.

Flow:

``` text
Backend OpenAPI 3.1
       ↓
Generate TypeScript client/types
       ↓
src/api/generated
       ↓
Domain query/mutation layer
       ↓
Pages / Features
```

Generated source tidak diedit manual.

### 3.4 Capability-driven UI

UI tidak menggunakan role name sebagai authorization logic.

Hindari:

``` text
role === "bendahara-rt"
```

Gunakan capability dari backend context:

``` text
can("payments.manual.approve")
```

Role merupakan grouping permission di backend. FE menggunakan capability
untuk presentation.

### 3.5 FE guard bukan security boundary

Route guard, hidden button, dan disabled action hanya UX.

Backend tetap wajib melakukan authorization.

------------------------------------------------------------------------

## 4. Context Switching

Context adalah kombinasi pekerjaan/identity presentation dan scope yang
tersedia bagi User.

Contoh:

``` text
Warga
└── Household H001

Bendahara
└── RT 03

Sekretaris
└── RW 05
```

Backend menyediakan available contexts berdasarkan active scoped
RoleAssignment.

Contoh contract konseptual:

``` json
{
  "contexts": [
    {
      "id": "household:H001",
      "type": "household",
      "label": "Warga",
      "scope": {
        "type": "household",
        "id": "H001"
      },
      "capabilities": [
        "invoices.view-own",
        "payments.submit",
        "patrol.view-own"
      ]
    },
    {
      "id": "rt:03:bendahara",
      "type": "management",
      "label": "Bendahara RT 03",
      "scope": {
        "type": "rt",
        "id": "03"
      },
      "capabilities": [
        "billing.view",
        "payments.manual.approve",
        "cashbook.view"
      ]
    }
  ]
}
```

### Active context

FE menyimpan satu `activeContextId`.

Switch context:

``` text
Context Switch
      ↓
validate against available contexts
      ↓
set activeContext
      ↓
invalidate context-sensitive queries
      ↓
navigate to context home
      ↓
reload authorized data
```

Context ID harus ikut pada request dengan convention yang disepakati
backend.

Context yang dikirim client tidak pernah memberikan privilege dengan
sendirinya.

Jika assignment dicabut/expired, backend menolak context dan FE harus
refresh `/auth/me`, memilih context valid, lalu menampilkan informasi
yang sesuai.

------------------------------------------------------------------------

## 4.1 HTTP & Context Contract

Target request pipeline:

``` text
Vue Feature
    ↓
Generated Orval Query / Mutation
    ↓
TanStack Vue Query
    ↓
Custom Axios Instance
    ├── Authorization
    ├── X-Rukun-Context
    ├── X-Request-ID
    └── Idempotency-Key (jika endpoint membutuhkan)
    ↓
Rukun API
```

Active context dikirim secara eksplisit melalui:

``` http
X-Rukun-Context: <context-id>
```

Header context bukan security boundary. Backend tetap memvalidasi
assignment aktif, permission, scope, dan Policy.

Business feature tidak boleh membaca/menulis token browser secara
langsung. Gunakan session abstraction (`getToken`, `setToken`, `clear`)
agar implementasi bearer token Core R saat ini tidak mengikat seluruh
codebase. Karena deployment direncanakan same-origin, arsitektur tetap
membuka jalur migrasi ke secure httpOnly cookie/session bila backend
mendukungnya kelak.

## 5. Application Shells

Tetap satu Vue application, tetapi presentation shell berbeda.

### Resident Shell

Mobile-first dan sederhana.

Primary navigation:

``` text
Beranda
Tagihan
Ronda
Layanan
Akun
```

Home mengutamakan actionable information:

-   outstanding tagihan;
-   payment submission status;
-   WiFi status;
-   gallon quota;
-   jadwal ronda;
-   pengumuman;
-   aktivitas yang memerlukan tindakan.

### Management Shell

Lebih information-dense untuk RT/RW.

Primary areas:

-   Dashboard;
-   Household/Warga;
-   Billing;
-   Payment Verification;
-   Cashbook;
-   WiFi;
-   Patrol;
-   Activities;
-   Citizen Services;
-   Reports.

Menu muncul berdasarkan capability active context.

### Vendor Shell

Workflow singkat:

-   dashboard;
-   eligible customers;
-   delivery/claim;
-   reconciliation/history.

### System Shell

Untuk Core/System administration yang memang tersedia bagi privileged
user.

Business administration tidak dicampur dengan Core/system
administration.

------------------------------------------------------------------------

## 6. Proposed Project Structure

Gunakan feature/domain-oriented architecture, bukan folder besar
`components/` dan `views/` yang akhirnya bercampur.

``` text
src/
├── app/
│   ├── bootstrap/
│   ├── router/
│   ├── providers/
│   ├── layouts/
│   └── config/
│
├── api/
│   ├── generated/
│   ├── client/
│   └── errors/
│
├── auth/
│   ├── queries/
│   ├── stores/
│   ├── guards/
│   └── components/
│
├── contexts/
│   ├── stores/
│   ├── composables/
│   └── components/
│
├── features/
│   ├── dashboard/
│   ├── households/
│   ├── residents/
│   ├── announcements/
│   ├── billing/
│   ├── payments/
│   ├── cashbook/
│   ├── wifi/
│   ├── gallon/
│   ├── patrol/
│   ├── activities/
│   ├── citizen-services/
│   ├── marketplace/
│   └── notifications/
│
├── shared/
│   ├── components/
│   ├── composables/
│   ├── directives/
│   ├── utils/
│   ├── types/
│   └── constants/
│
├── design-system/
│   ├── primitives/
│   ├── patterns/
│   └── tokens/
│
├── i18n/
├── pwa/
└── main.ts
```

### Rules

`shared/` hanya untuk sesuatu yang benar-benar domain-neutral.

Feature tidak boleh mengambil internal implementation feature lain
secara sembarangan.

Cross-feature business flow dilakukan melalui public feature
API/composable atau route, bukan deep import.

`api/generated/` dianggap generated code.

------------------------------------------------------------------------

## 7. PrimeVue UI Foundation

Gunakan PrimeVue sebagai component foundation agar project blank dapat
bergerak cepat tanpa mewarisi arsitektur admin template pihak ketiga.

Komponen utama menggunakan PrimeVue, antara lain:

-   Button/Input/Password/Select/DatePicker;
-   Dialog/Drawer/Toast/ConfirmDialog;
-   DataTable/Paginator/Tabs/Menu;
-   FileUpload;
-   Badge/Tag/Skeleton;
-   komponen form yang sesuai.

Buat wrapper Rukun hanya bila memberi semantic application value yang
stabil, misalnya `MoneyDisplay`, `StatusBadge`, `PageHeader`,
`EmptyState`, `ErrorState`, `ConfirmAction`, `SensitiveValue`, dan
`ContextSwitcher`.

Jangan membuat komponen custom yang bersaing dengan primitive PrimeVue
tanpa kebutuhan nyata.

### Accessibility

Minimum:

-   semantic HTML;
-   keyboard navigation;
-   visible focus;
-   label/form association;
-   accessible dialog;
-   sufficient touch target;
-   status tidak bergantung pada warna saja;
-   loading/error/success feedback jelas;
-   destructive action membutuhkan confirmation.

### Resident UX

-   mobile-first;
-   bahasa Indonesia sederhana;
-   tombol utama besar;
-   form pendek;
-   nominal Rupiah jelas;
-   status pembayaran tidak ambigu;
-   satu primary action per flow bila memungkinkan.

## 8. Routing Strategy

Conceptual route:

``` text
/auth/*
/app/*
/manage/*
/vendor/*
/system/*
```

Contoh:

``` text
/auth/login
/auth/forgot-password
/auth/change-initial-password

/app/home
/app/bills
/app/payments
/app/patrol
/app/services
/app/marketplace
/app/account

/manage/dashboard
/manage/households
/manage/residents
/manage/billing
/manage/payments
/manage/cashbook
/manage/wifi
/manage/patrol
/manage/activities
/manage/services
/manage/reports

/vendor/dashboard
/vendor/wifi
/vendor/gallon

/system/*
```

Route meta dapat menyatakan:

``` text
requiresAuth
contextTypes
requiredCapabilities
```

Router guard menggunakan metadata untuk UX/navigation, tetapi
authorization final tetap backend.

------------------------------------------------------------------------

## 9. Authentication UX

### Login

Satu field identifier:

``` text
Email atau nomor HP
Password
```

Request mengikuti backend contract.

### Initial credential

Jika backend menyatakan `must_change_password`:

``` text
Login
 ↓
PASSWORD_CHANGE_REQUIRED
 ↓
forced password-change screen
 ↓
success
 ↓
refresh session
 ↓
application
```

User tidak boleh masuk business screen sebelum requirement selesai.

### Forgot password

MVP menampilkan jalur yang benar-benar tersedia:

-   reset melalui email;
-   bantuan pengurus;
-   household-assisted recovery bila backend menyatakan eligible.

FE tidak menentukan eligibility recovery sendiri.

### Session expiration

401 global flow:

1.  hentikan retry yang tidak relevan;
2.  clear sensitive client cache;
3.  simpan intended route jika aman;
4.  arahkan login;
5.  setelah login, restore route/context jika masih valid.

------------------------------------------------------------------------

## 10. Query & Mutation Architecture

Setiap feature mempunyai query keys yang konsisten.

Contoh konseptual:

``` text
["households", contextId, filters]
["invoices", contextId, filters]
["payment-submissions", contextId, filters]
```

Context ID harus menjadi bagian query key untuk data scoped.

### Mutation

Mutation tidak mengedit cache secara spekulatif untuk financial state
yang sensitif kecuali semantics benar-benar aman.

Setelah financial mutation:

``` text
mutation
 ↓
backend success
 ↓
invalidate authoritative queries
 ↓
refetch
```

Optimistic UI lebih cocok untuk state ringan seperti read/unread, bukan
approval pembayaran atau ledger.

------------------------------------------------------------------------

## 11. Error Handling

Frontend mengikuti stable backend `code`, bukan membandingkan message
string.

Central API error normalizer menghasilkan struktur seperti:

``` text
code
message
fieldErrors
requestId
httpStatus
```

UI:

-   validation error → dekat field;
-   authorization → forbidden state;
-   expired context → refresh context;
-   conflict → actionable conflict message;
-   rate limit → retry information;
-   unknown/server error → generic error + `X-Request-ID`.

`X-Request-ID` dapat disalin user untuk bantuan teknis.

------------------------------------------------------------------------

## 12. Idempotency

Untuk action create yang sensitif, FE menghasilkan `Idempotency-Key` per
user intent.

Contoh:

-   payment checkout;
-   cash receipt;
-   payment submission;
-   import;
-   other backend endpoints yang mensyaratkan idempotency.

Key tidak digenerate ulang hanya karena browser melakukan retry dari
intent yang sama.

Double-click submit harus dicegah di UI, tetapi backend idempotency
tetap menjadi protection utama.

------------------------------------------------------------------------

## 13. Realtime & Synchronization

Realtime bukan dependency business logic.

Flow:

``` text
Backend durable event
        │
        ├── polling /api/events
        └── Reverb/Echo jika tersedia
                ↓
        Event normalization
                ↓
        dedupe event ID
                ↓
        invalidate/update Query cache
```

Contoh event:

-   payment submission approved/rejected;
-   invoice changed;
-   notification received;
-   gallon delivery;
-   announcement published.

Reconnect harus dapat mengejar event yang terlewat melalui durable
cursor.

------------------------------------------------------------------------

## 14. PWA Strategy

PWA digunakan agar warga dapat memasang Rukun dari browser.

### Cache

Aman untuk cache:

-   app shell;
-   JS/CSS bundles;
-   icons;
-   static public assets.

Sensitive/domain data tidak dibuat offline-first secara default.

Tidak menyimpan NIK/KK atau financial dataset ke persistent browser
cache tanpa kebutuhan eksplisit.

### Update

Service worker update harus mempunyai UX yang jelas.

Contoh:

``` text
Versi baru Rukun tersedia.
[Perbarui]
```

Jangan reload paksa ketika user sedang mengisi form/payment flow.

------------------------------------------------------------------------

## 15. Security Baseline

Frontend security baseline:

-   CSP ketat;
-   tidak memasang third-party script tanpa alasan;
-   tidak menggunakan `v-html` untuk untrusted content;
-   dependency audit;
-   no secrets di Vite env/client bundle;
-   source map production ditentukan sesuai operational need;
-   redact sensitive telemetry;
-   clear sensitive query cache saat logout/context invalidation.

Backend plan saat ini menggunakan Sanctum bearer token. Storage strategy
token harus diputuskan dan diuji pada F0. Karena FE/API direncanakan
same-domain, evaluasi juga migration path ke secure httpOnly
cookie/session jika backend contract kelak mendukungnya.

Jangan menyimpan token atau secret di Pinia persisted state secara
sembarangan.

------------------------------------------------------------------------

## 16. Forms

Gunakan **PrimeVue Forms + Zod** sebagai standar form di seluruh
aplikasi.

Form layer harus mendukung:

-   schema/client validation untuk UX;
-   backend validation sebagai authoritative;
-   field error mapping;
-   dirty state;
-   submit state;
-   duplicate submit protection;
-   unsaved-change warning pada flow penting;
-   money normalization;
-   phone normalization presentation;
-   file upload state.

Client validation tidak boleh menduplikasi business rules kompleks dari
backend.

------------------------------------------------------------------------

## 17. Financial UX Rules

### Payment status language

Bedakan dengan tegas:

``` text
Pengajuan dikirim
≠
Pembayaran diterima
```

Manual transfer:

``` text
submitted → Menunggu verifikasi
approved  → Pembayaran terverifikasi
rejected  → Pengajuan ditolak
```

Invoice `paid` hanya ditampilkan setelah backend menyatakan state
tersebut.

### Manual transfer

Flow warga:

``` text
Invoice
→ pilih Transfer Bank
→ lihat rekening + nominal
→ transfer
→ upload bukti
→ submit
→ Menunggu Verifikasi
→ Approved/Rejected
```

Flow management:

``` text
Pending submissions
→ detail
→ evidence
→ approve/reject
→ server recalculates financial state
```

### Cash

Management screen mencatat cash receipt melalui Billing API.

### QRIS

FE:

-   meminta checkout;
-   menampilkan QRIS/payment instruction dari backend/payment provider;
-   menunggu verified status;
-   menggunakan realtime/polling;
-   tidak menganggap redirect client sebagai bukti payment success.

------------------------------------------------------------------------

## 18. Patrol UX

Warga melihat:

-   jadwal berikutnya;
-   histori;
-   status attendance;
-   action izin bila assignment eligible.

Izin:

``` text
Assignment
→ Ajukan izin
→ alasan
→ submit
→ backend menentukan kewajiban sesuai policy
```

Jika izin menghasilkan biaya, FE menampilkan kewajiban dari Billing.

FE tidak menghitung sendiri biaya izin.

Pengurus berwenang dapat mencatat izin atas nama warga melalui
Management Shell.

------------------------------------------------------------------------

## 19. Testing Strategy

Frontend tidak dianggap solid hanya karena TypeScript compile.

### Unit tests

Untuk:

-   pure utility;
-   formatter;
-   permission/capability presentation helper;
-   query key factory;
-   error normalizer;
-   state transition helper yang memang berada di FE.

### Component tests

Untuk reusable component dan flow penting:

-   form behavior;
-   loading/error/empty;
-   capability visibility;
-   dialog confirmation;
-   context switcher.

### E2E tests

Minimum critical journeys:

1.  login email;
2.  login phone;
3.  forced initial password change;
4.  context switch warga → pengurus;
5.  warga melihat invoice;
6.  warga submit manual transfer;
7.  bendahara approve;
8.  warga melihat payment verified;
9.  cash receipt;
10. QRIS flow ketika F5 tersedia;
11. patrol excuse;
12. unauthorized context/action ditolak.

E2E environment menggunakan staging/test backend yang deterministik atau
controlled fixtures.

------------------------------------------------------------------------

## 20. Code Quality Gates

Setiap PR minimal menjalankan:

``` text
install locked dependencies
typecheck
lint
format check
unit/component tests
build
OpenAPI client drift check
```

Critical phase menambahkan E2E smoke test.

Tidak merge jika generated API client tidak sinkron dengan OpenAPI yang
disepakati.

### TypeScript

Gunakan strict mode.

Hindari:

-   `any` tanpa alasan;
-   type assertion berlebihan;
-   duplicated backend DTO;
-   string permission tersebar di seluruh component.

Capability constants/helper harus centralized/generated bila
memungkinkan.

------------------------------------------------------------------------

# Progress Tracker

> **Audit aktual 2026-10-01:** status selesai historis di bawah telah dikoreksi
> berdasarkan pemeriksaan source dan browser. FE-0/FE-1 mendapat perbaikan
> fondasi, FE-2 masih memerlukan verifikasi isolasi scope pada backend nyata.
> FE-3 tahap 3 menambahkan detail/edit/hapus wilayah setelah mutasi dan riwayat.
> Kontrak sementara `FILE_BE/openapi.json` identik dengan snapshot generator.
> Gap FE-0–FE-3: [review OpenAPI](docs/openapi-review-fe0-fe3.md).
> Detail: [docs/frontend-audit.md](docs/frontend-audit.md).

> Diperbarui: 2026-10-01

| Fase | Nama | Status | Tanggal Selesai |
|------|------|--------|-----------------|
| FE-0 | Project Foundation | 🔧 Diperbaiki; verifikasi lokal, CI remote pending | — |
| FE-1 | UI Foundation & Application Shells | 🔧 UI responsif, tema terang/gelap, ID/EN; shell scoped diuji component | — |
| FE-2 | Authentication + Context + RBAC | ⚠️ Auth diperbaiki; gate integrasi scoped nyata belum terverifikasi | — |
| FE-3 | Resident + Household + Area | 🚧 Tahap 3: detail/edit/hapus wilayah; gate FE-3 belum lengkap | — |
| FE-4 | Billing + Manual Payment + Cashbook | ⏳ Belum dimulai | — |
| FE-5 | WiFi + Gallon | ⏳ Belum dimulai | — |
| FE-6 | QRIS / Payment Gateway | ⏳ Belum dimulai | — |
| FE-7 | Announcements + Citizen Services | ⏳ Belum dimulai | — |
| FE-8 | Patrol + Activities | ⏳ Belum dimulai | — |
| FE-9 | Marketplace | ⏳ Belum dimulai | — |
| FE-10 | CCTV | 🚫 Ditunda (HOLD) | — |

------------------------------------------------------------------------

# PHASE FE-0 --- Project Foundation ⚠️ Fondasi lokal tersedia; CI remote pending

Fase ini membangun technical skeleton. Jangan mulai business screen.

## Scope

-   pnpm + pinned version + lockfile;
-   Vue 3/Vite/TypeScript strict;
-   PrimeVue 4;
-   Tailwind CSS 4;
-   Vue Router;
-   Pinia;
-   TanStack Vue Query;
-   PrimeVue Forms + Zod;
-   Axios;
-   Orval;
-   vue-i18n;
-   Vitest;
-   Playwright;
-   vite-plugin-pwa;
-   ESLint/formatting;
-   environment/config validation;
-   bootstrap/providers;
-   central API error normalization;
-   OpenAPI generation scripts;
-   CI. 

## Required scripts

``` text
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm api:generate
```

## Acceptance Gate

-   clean install dari lockfile berhasil;
-   production build lulus;
-   TypeScript strict lulus;
-   lint/format/test lulus;
-   E2E smoke baseline lulus;
-   OpenAPI client reproducible;
-   generated code tidak diedit manual;
-   CI lulus.

## Implementasi FE-0 (Selesai 2026-09-29)

File yang dibuat / dimodifikasi:

| File | Keterangan |
|------|------------|
| `package.json` | Semua deps runtime + dev, scripts, engines, pnpm config |
| `.npmrc` | `engine-strict=true`, `shamefully-hoist=false` |
| `vite.config.ts` | Tailwind 4, VitePWA (prompt, app shell), devtools |
| `vitest.config.ts` | `mergeConfig` dari vite.config, env jsdom |
| `playwright.config.ts` | Chromium, `webServer: pnpm dev` |
| `eslint.config.ts` | Flat config — vue / ts / playwright |
| `.prettierrc` | No semi, single quote, 100 cols |
| `orval.config.ts` | OpenAPI → TanStack Query, custom axios mutator |
| `.env.example` | `VITE_API_BASE_URL`, `VITE_APP_ENV` |
| `.gitignore` | Tambah `src/api/generated/`, playwright artifacts |
| `.github/workflows/ci.yml` | typecheck → lint → format:check → test → build |
| `src/App.vue` | `<RouterView />` saja |
| `src/main.ts` | `bootstrap()` entry |
| `src/app/bootstrap/index.ts` | createApp factory + semua plugins |
| `src/app/config/env.ts` | Zod env validation, throw saat startup jika invalid |
| `src/app/config/env.test.ts` | Smoke test (valid + missing URL) |
| `src/app/router/index.ts` | Semua placeholder routes, RouteMeta augmentation, global guard |
| `src/app/providers/query.ts` | TanStack Query client (staleTime 1min, retry 1) |
| `src/app/layouts/PlaceholderPage.vue` | Placeholder route display |
| `src/api/client/http.ts` | Axios instance + interceptors Bearer/X-Rukun-Context/X-Request-ID |
| `src/api/errors/types.ts` | `NormalizedApiError`, `ApiFieldErrors` |
| `src/api/errors/normalizer.ts` | `normalizeApiError()`, `isApiError()` |
| `src/api/generated/.gitkeep` | Placeholder untuk output Orval |
| `src/auth/stores/session.ts` | `getToken/setToken/clear` over localStorage |
| `src/contexts/stores/context.ts` | Pinia context store, `can()`, `switchContext()` |
| `src/i18n/index.ts` | vue-i18n Composition API mode |
| `src/i18n/locales/id.ts` | Locale Bahasa Indonesia |
| `src/assets/main.css` | `@import "tailwindcss"` |
| `e2e/smoke.spec.ts` | Playwright: app loads tanpa crash |

Gates yang lulus:

```
pnpm typecheck   ✓  0 errors
pnpm build-only  ✓  356 modules, PWA sw generated
pnpm lint        ✓  0 errors
pnpm test        ✓  2/2 (env smoke test)
```

------------------------------------------------------------------------

# PHASE FE-1 --- UI Foundation & Application Shells ⚠️ UI tersedia; gap locale/a11y tersisa

## Scope

-   PrimeVue Styled Mode + Aura;
-   semantic styling/token Rukun;
-   ResidentShell;
-   ManagementShell;
-   VendorShell;
-   SystemShell;
-   responsive navigation;
-   management sidebar/topbar;
-   resident bottom navigation;
-   PageHeader;
-   EmptyState;
-   ErrorState;
-   StatusBadge;
-   MoneyDisplay;
-   ConfirmAction;
-   loading/skeleton convention;
-   Toast/Dialog/Drawer convention.

## Acceptance Gate

-   resident shell nyaman pada mobile;
-   management shell usable pada tablet/desktop;
-   tidak ada layout overflow utama;
-   keyboard/focus behavior bekerja;
-   tidak ada duplicate UI primitive tanpa alasan;
-   accessibility smoke test lulus.

## Implementasi FE-1 (Selesai 2026-09-29)

| File | Keterangan |
|------|------------|
| `src/design-system/theme/preset.ts` | RukunPreset — Aura + teal primary + slate surface tokens |
| `src/app/bootstrap/index.ts` | Diupdate: pakai `primeVueConfig` dari preset |
| `src/app/layouts/AuthLayout.vue` | Bare centered layout untuk auth screens |
| `src/app/layouts/ResidentShell.vue` | Mobile-first: sticky header + scrollable main + fixed bottom nav (5 item) |
| `src/app/layouts/ManagementShell.vue` | Sidebar collapse (56px/224px) + topbar + capability-filtered nav |
| `src/app/layouts/VendorShell.vue` | Topbar + 4 nav items (Dashboard, Pelanggan, Pengiriman, Riwayat) |
| `src/app/layouts/SystemShell.vue` | Dark topbar + page title bar + 3 admin nav items |
| `src/app/router/index.ts` | Diupdate: shell sebagai parent route + `title` meta + scroll behavior |
| `src/design-system/components/PageHeader.vue` | Title + optional back button + actions slot |
| `src/design-system/components/EmptyState.vue` | Icon + title + description + action slot |
| `src/design-system/components/ErrorState.vue` | Alert role + retry button + `@retry` event |
| `src/design-system/components/StatusBadge.vue` | 9 status (pending/approved/rejected/paid/unpaid/overdue/active/inactive/processing) |
| `src/design-system/components/MoneyDisplay.vue` | IDR format via `Intl.NumberFormat`, signed, dimZero |
| `src/design-system/components/ConfirmAction.vue` | Wraps PrimeVue `useConfirm`, severity=danger support |
| `src/design-system/components/SensitiveValue.vue` | Hidden-by-default + toggle reveal dengan accessible button |
| `src/design-system/components/AppSkeleton.vue` | `card` / `list` variant via PrimeVue Skeleton |
| `src/design-system/index.ts` | Barrel export semua design-system components |

Gates yang lulus:

```
pnpm typecheck   ✓  0 errors
pnpm build-only  ✓  367 modules, semua shell code-split
```

------------------------------------------------------------------------

# PHASE FE-2 --- Authentication + Context + RBAC ⚠️ Gate scoped belum lulus

## Authentication

-   login email/phone;
-   logout;
-   `/auth/me`;
-   session abstraction;
-   forced initial password change;
-   forgot-password entry;
-   session-expiry flow.

## Context

-   available contexts;
-   active context;
-   ContextSwitcher;
-   `X-Rukun-Context`;
-   context-aware query keys;
-   invalid/revoked context recovery.

## RBAC Presentation

-   centralized `can(permission)`;
-   capability-aware route;
-   capability-aware navigation;
-   capability-aware action.

## Acceptance Gate

Test minimal:

``` text
Warga
 → Bendahara RT 03
 → Warga
```

tanpa login ulang, stale data, atau cross-scope cache leak.

Fake context tidak memberi akses. Revoked assignment dipulihkan dengan
aman. Forced password change memblok business screen sampai selesai.

------------------------------------------------------------------------

## Implementasi FE-2 (Selesai 2026-09-29)

| File | Keterangan |
|------|------------|
| `src/auth/stores/session.ts` | Diperluas: `SessionUser` (id/name/email/phone/mustChangePassword) + `isAuthenticated()` |
| `src/auth/api/types.ts` | `LoginRequest`, `LoginResponse`, `MeResponse`, `ForgotPasswordRequest`, `ChangePasswordRequest` |
| `src/auth/api/auth.ts` | `apiLogin()`, `apiLogout()`, `apiFetchMe()`, `apiForgotPassword()`, `apiChangePassword()` |
| `src/auth/composables/useAuth.ts` | `login()` / `logout()` / `hydrate()` — orchestrasi session + context store + redirect |
| `src/api/client/http.ts` | Ditambah 401 response interceptor → clear session + redirect login (dynamic import) |
| `src/auth/pages/LoginPage.vue` | Form email/phone + password, show/hide, field error display, `useAuth().login()` |
| `src/auth/pages/ForgotPasswordPage.vue` | Identifier input + success state setelah kirim |
| `src/auth/pages/ChangeInitialPasswordPage.vue` | Forced password change: current + new + confirm, mismatch validation |
| `src/auth/pages/SelectContextPage.vue` | Pilih konteks dari `ContextSwitcher`, redirect ke shell yang sesuai |
| `src/auth/components/ContextSwitcher.vue` | List `availableContexts`, switch konteks aktif + emit `switched` |
| `src/app/router/index.ts` | Guard diperluas: `mustChangePassword` redirect, `contextTypes` check, `select-context` fallback |
| `src/App.vue` | `onMounted(hydrate)` — hydrate user + contexts dari `/auth/me` setiap load |
| `src/i18n/locales/id.ts` | Strings auth: identifier, newPassword, confirmPassword, forcedChangeHint, sessionExpired, dll |
| `src/auth/stores/session.test.ts` | 5 unit tests session store |

Gates yang lulus:

```
pnpm test        ✓  7/7 tests (2 files)
pnpm typecheck   ✓  0 errors
pnpm build-only  ✓  build sukses, semua auth pages code-split
```

------------------------------------------------------------------------

# PHASE FE-3 --- Resident + Household + Area 🚧 Tahap 3

## Batas penyerahan FE-3 tahap 1 (2026-09-30)

Sesuai arahan pengguna, implementasi diserahkan per fase/tahap untuk pengujian
manual. Jangan melanjutkan fitur/fase berikutnya sebelum instruksi pengguna.

- [x] Dashboard pengurus dengan menu sesuai permission global aktual.
- [x] Daftar/detail/tambah/ubah Household.
- [x] Daftar/detail/tambah/ubah Resident; tautan anggota dari Household.
- [x] Daftar/tambah RW/RT; select RW induk, RT untuk KK, dan KK untuk warga.
- [x] Select referensi memakai generated API, pencarian lokal, cursor load-more,
  label nama/kode/alamat, initial KK via detail, error/retry, dan capability read.
- [x] Filter daftar KK memakai select RT.
- [x] Seluruh tabel tahap berjalan memakai `AppDataTable` reusable berbasis
  PrimeVue: toolbar/search lokal, sort lokal, striped rows, scroll, states,
  retry, penghitung halaman, dan opaque cursor pagination terpusat.
- [x] Kolom KK mengutamakan alamat/blok/nomor/hunian, warga memakai nama/HP;
  referensi internal tidak ditampilkan. Nama kepala keluarga menunggu DTO backend.
- [x] Component test tabel bersama dan E2E kolom manusiawi, search/sort,
  mobile, dark mode, serta EN. Search/sort global menunggu dukungan API.
- [x] Dark mode tersedia pada auth dan shell management/system/resident/vendor;
  pilihan tersimpan, tema awal mengikuti sistem.
- [x] Bahasa ID/EN untuk UI tahap berjalan, default ID, tersimpan di browser,
  atribut html lang dan tanggal mengikuti pilihan. Data backend tidak diterjemahkan.
- [x] Unit/component test referensi dan preferensi seluruh shell; E2E payload
  select, pagination RW, preselected KK, retry, dark mode/locale setelah reload.
- [x] Cursor pagination, query key context, cache cleanup, loading/error/empty.
- [x] PrimeVue Forms + Zod, backend field errors, duplicate-submit protection,
  idempotency key stabil untuk retry payload yang sama.
- [x] NIK/KK tidak dimuat melalui list/detail biasa.
- [x] Review reuse tahap berjalan: PrimeVue Toolbar/Message/Tag/Password digunakan;
  primitive tidak diimplementasikan ulang. PageHeader digunakan lima halaman.
- [x] Composable submit + idempotency/error/locking, guard unsaved changes,
  pemisahan query ReferenceSelect, dan katalog opsi domain terpusat.
- [x] Regression test lifecycle submit, route/unload guard, dropdown dirty,
  serta keyboard/locale Password. Temuan dicatat di docs/component-review.md.
- [x] Beranda warga: household dan anggota dari context server (fixture; gate scope nyata pending).
- [x] Profil/account, password mandiri, bahasa akun dan sesi perangkat.
- [x] UI status, kirim ulang, dan pemeriksaan verifikasi email.
- [ ] Integrasi email bertanda tangan nyata dan notification inbox.
- [x] Mutasi membership dan riwayat (FE-3 tahap 2).
- [ ] Import/export UI dan progress/result.
- [ ] Scoped role assignment dan reveal/edit data sensitif.
- [x] Detail/edit/hapus wilayah (FE-3 tahap 3; mutasi nyata pending).
- [ ] Verifikasi kontrak context scoped dan gate isolasi RT/RW/Vendor.
- [ ] Pengumuman (menunggu modul backend).
- [ ] Uji manual oleh pengguna terhadap akun/backend development.

FE-3 belum ditandai selesai. FE-4 dan fase berikutnya belum dimulai.
Verifikasi lokal 2026-09-30: **46/46 unit/component test (13 file)** dan **28/28 E2E
Chromium** lulus. TypeScript aplikasi/config, lint, format, production build,
install frozen lockfile, dan OpenAPI drift check lulus. E2E memakai fixture
kontrak. Login/pembacaan daftar akun development diperiksa pada iterasi UI;
CRUD akun nyata, multi-scope backend, CI remote, serta testing manual pengguna
belum diverifikasi. Shell warga/vendor diuji lewat component test. Checklist
select, tema, dan bahasa tersedia di README. Catatan ini merupakan hasil penyerahan tahap 1; progres terbaru ada di tahap 2.

Hasil automated test dan batas integrasi dicatat di README dan audit frontend.

## Penyerahan FE-3 tahap 2: mutasi dan riwayat (2026-09-30)

Pengguna memilih melanjutkan mutasi keluarga + riwayat sebelum FE-4.

- [x] Halaman keanggotaan dari detail warga dengan guard `residents.view`.
- [x] Riwayat cursor memakai AppDataTable dan generated API; alamat dibaca hanya
  sesuai capability, dideduplikasi/cache, tanpa fallback UUID.
- [x] Pindah keluarga, ubah hubungan dalam KK sama, dan akhiri keanggotaan memakai
  PUT membership; PrimeVue Select/Form/ConfirmDialog dan helper submit bersama.
- [x] Tinjauan nama/alamat/dampak sebelum mutasi; cancel tidak menulis data.
- [x] Error backend, duplicate-submit lock, tanpa optimistic update; setelah sukses
  cache community dibersihkan dan profile di-refresh untuk perubahan akses.
- [x] Bahasa ID/EN, tema gelap, mobile, unit test payload dan E2E alur utama.
- [ ] Pengujian mutasi dengan data development oleh pengguna.
- [ ] Gate isolasi scope dan pencabutan akses pada backend nyata belum diverifikasi.

Verifikasi tahap 2: **52 unit/component test (14 file)** dan **39 E2E Chromium**;
checklist manual dan batas idempotency/backend ada di `docs/membership-stage.md`.
FE-3 belum selesai seluruhnya; FE-4 belum dimulai. Penyerahan ini berhenti pada
mutasi + riwayat agar pengguna dapat menguji dahulu.

## Penyerahan FE-3 tahap 3: wilayah (2026-10-01)

- [x] Nama wilayah pada DataTable membuka detail dengan guard `areas.view`.
- [x] Edit code/name memakai `areas.manage`; schema/payload create/edit bersama,
  trim, wajib isi, batas 20/100 karakter, tanpa kind/parent_id saat PATCH.
- [x] Jenis/induk immutable; RW induk dengan nama/kode, fallback tanpa UUID dan retry.
- [x] Hapus melalui PrimeVue ConfirmDialog, cancel tanpa request, error 403/409/422,
  form tetap saat gagal, unsaved guard dan duplicate-submit lock.
- [x] Cache Community dan pilihan referensi dibersihkan setelah sukses; ID/EN,
  dark mode, mobile dan komponen/query bersama.
- [x] **57 unit/component test (15 file), 49 E2E Chromium**, typecheck dan build lulus.
- [ ] Uji edit/hapus data development serta isolasi scope nyata oleh pengguna.

Checklist: [docs/area-stage.md](docs/area-stage.md). FE-4 belum dimulai.

## Gap terverifikasi sampai FE-3 — kontrak sementara 2026-10-01

`FILE_BE/openapi.json` dan `openapi/rukun.json` identik secara semantik:
**126 path, 155 operasi, 193 schema**, seluruh referensi lokal ter-resolve.
Snapshot/client tidak perlu diganti. Catatan selesai historis di atas tidak
menggantikan gate aktual berikut. Matriks endpoint, bukti source dan batas review
ada di [docs/openapi-review-fe0-fe3.md](docs/openapi-review-fe0-fe3.md).

- [ ] FE-0: verifikasi CI remote; konsistensi response/domain invariant.
- [x] FE-1/2: Accept-Language mengikuti locale UI tiap request; default ID,
  persistensi lokal dan fallback saat storage gagal teruji.
- [x] FE-1/2: bahasa akun tersimpan via profil; saat login preferensi perangkat
  eksplisit > locale akun > ID.
- [ ] FE-1/2: audit a11y/reuse dan menu placeholder tersisa.
- [x] FE-2: form reset token/email, alias tautan email, validasi minimal 12,
  konfirmasi, error/retry, sukses dan login ulang; minimum change tetap 8.
- [ ] FE-2: uji pengiriman email dan reset password development nyata.
- [ ] FE-2/3: tetapkan transport context aktif dan recovery invalid/revoked;
  `contexts` **sudah tersedia**, tetapi `X-Rukun-Context` belum dideklarasikan.
  Uji multi-assignment, cross-RT, RW inheritance, vendor dan revocation nyata.
- [x] FE-3: profil nama/bahasa, password mandiri, daftar/cabut sesi dan logout semua.
- [x] FE-3: UI status/kirim ulang/periksa verifikasi email.
- [ ] FE-3: pengiriman email dan signed verification backend nyata.
- [ ] FE-3: inbox/unread/read state/preferences; endpoint sudah ada, UI belum.
- [ ] FE-3: import/export file, progress/poll/cancel, hasil/error/download.
- [ ] FE-3: provisioning/link/recovery akun dan credential sekali pakai.
- [ ] FE-3: scoped role assignment (global users.assign-roles), selector referensi.
- [ ] FE-3: sensitive NIK/KK reveal/edit dengan permission dan no-store.
- [ ] FE-3: validasi block/house_number max 50, filter RT daftar warga, perapihan
  beranda warga (tanggal/label/dark mode), uji status KK dengan anggota aktif.
- [ ] Kontrak: required fields DTO domain, label relasi, replay semantics dan
  error code context. Search/sort global/total belum didukung; tabel tetap lokal.
- [ ] Pengumuman: belum ada endpoint, tetap menunggu kontrak backend.

Prioritas tahap selanjutnya: gap context/integrasi email nyata → inbox →
population transfer → administrasi Community/sensitive → gate integrasi akhir
FE-3. Kerjakan satu tahap per penyerahan dengan instruksi pengguna; jangan
menandai FE-2/FE-3 selesai hanya karena client endpoint sudah generated.

## Penyerahan tahap auth/bahasa (2026-10-01)

Pengguna memilih menutup reset password + bahasa API sebelum billing.

- [x] Route publik `/reset-password` dan `/auth/reset-password` menerima token/email
  sesuai tautan backend, tanpa bergantung pada hydration sesi lama.
- [x] PrimeVue Form/Password dan helper submission/error bersama; Zod min. 12,
  konfirmasi cocok, payload whitelist, request rangkap dikunci.
- [x] Error invalid/expired/used/rate limit/outage tetap memberi jalur meminta
  tautan baru; sukses membersihkan sesi/cache dan token/email URL aktif.
- [x] Login/forgot/reset tidak mengirim bearer/context lama. Request protected
  mempertahankan auth/scope. Header bahasa mengikuti UI secara dinamis.
- [x] **67/67 unit test (17 file, --maxWorkers=2), 58/58 E2E Chromium**;
  typecheck, lint dan production build lulus. Locale backend development
  diverifikasi lewat GET /api/locales (HTTP 200, Content-Language ID/EN).
- [ ] Integrasi email/reset nyata dan gate context belum ditutup. Locale profil
  diselesaikan pada tahap account berikutnya.

Checklist: [docs/auth-recovery-stage.md](docs/auth-recovery-stage.md).
FE-3 belum selesai seluruhnya; FE-4 belum dimulai. Penyerahan berhenti pada
reset password + bahasa API untuk pengujian pengguna.

## Penyerahan account tahap 1–2 (2026-10-01)

Pengguna mengizinkan lanjut tahap berikutnya setelah tahap 1 lolos pemeriksaan.

- [x] Halaman `/account` dipakai bersama semua jenis akses; menu Akun saya dan
  redirect `/app/account`; initial-password guard tetap berlaku.
- [x] Profil name/locale, validasi dan field error; email/HP read-only;
  UI/session memakai respons server, tanpa update optimistis.
- [x] Prioritas bahasa perangkat eksplisit > profil > ID; simpan profil
  menerapkan bahasa akun, toolbar tetap preferensi lokal tanpa PATCH otomatis.
- [x] Password mandiri dengan password saat ini, min. 8, konfirmasi cocok dan
  berbeda; sukses membersihkan input dan mempertahankan sesi perangkat ini.
- [x] Dua form memakai PrimeVue dan helper bersama; dirty guard tidak hilang
  saat form lain disimpan. Tidak ada submit bersamaan.
- [x] Sesi perangkat memakai AppDataTable, nama/tanggal manusiawi, current marker,
  empty/error/retry, konfirmasi cabut satu atau semua sesi.
- [x] Cabut sesi lain mempertahankan login; cabut current/semua baru logout lokal
  setelah sukses. Error tidak menghapus data secara optimistis.
- [x] Formatter tanggal reusable untuk membership dan sesi; ID/EN dan dark mobile.
- [x] **77/77 unit test (20 file), 76/76 E2E Chromium**, typecheck dan production
  build lulus; lint/format diperiksa.
- [ ] Pengujian profil/password dan pencabutan sesi backend nyata oleh pengguna.
- [ ] Verifikasi email dan gate isolasi scope nyata masih terbuka.

Checklist: [docs/account-stage.md](docs/account-stage.md). Penyerahan berhenti
pada account tahap 2; inbox dan FE-4 belum dimulai.

## Resident

-   home;
-   household summary;
-   household members;
-   profile/account;
-   notification inbox;
-   announcements.

## Management

-   RT/RW dashboard foundation;
-   household list/detail;
-   resident list/detail;
-   create/update;
-   mutation;
-   import + progress/result;
-   scoped role assignment;
-   sensitive data gated display.

## Acceptance Gate

-   RT isolation benar;
-   RW hanya melihat child scope yang diizinkan;
-   context switch tidak meninggalkan stale scoped list;
-   NIK/KK hidden kecuali authorized;
-   import error dapat dipahami;
-   loading/error/empty state lengkap.

------------------------------------------------------------------------

# PHASE FE-4 --- Billing + Manual Payment + Cashbook

## Resident

-   outstanding summary;
-   invoice list/detail;
-   payment history;
-   receipt;
-   manual transfer submission;
-   proof upload;
-   pending/approved/rejected state.

UI wajib membedakan:

``` text
Pengajuan dikirim
≠
Pembayaran diterima
```

## Management

-   billing dashboard;
-   payment type/tariff;
-   invoice list/detail;
-   manual-payment review queue;
-   proof viewer;
-   approve/reject;
-   cash receipt;
-   cashbook;
-   expense;
-   accounting period close;
-   monthly report.

## Acceptance Gate

-   pending transfer tidak pernah ditampilkan paid;
-   approved state berasal dari server Receipt/Allocation;
-   financial mutation tidak memakai unsafe optimistic update;
-   duplicate submit terlindungi;
-   Rupiah konsisten;
-   closed-period error actionable.

------------------------------------------------------------------------

# PHASE FE-5 --- WiFi + Gallon

## Resident

-   WiFi status;
-   current invoice/payment state;
-   gallon quota;
-   claim/delivery history;
-   confirmation.

## Management

-   WiFi customers/packages;
-   collection recap;
-   remittance;
-   advance;
-   reconciliation.

## Vendor

-   eligible customer;
-   delivery;
-   pending confirmation;
-   history/reconciliation.

## Acceptance Gate

-   vendor isolation;
-   quota/eligibility berasal dari server;
-   confirmation flow jelas;
-   WiFi pass-through tidak dipresentasikan sebagai RT income.

------------------------------------------------------------------------

# PHASE FE-6 --- QRIS / Payment Gateway

``` text
Pilih tagihan
 ↓
Request checkout
 ↓
QRIS
 ↓
Pending
 ↓
Polling / realtime
 ↓
Verified
 ↓
Receipt
```

## Acceptance Gate

-   authoritative amount berasal dari server;
-   duplicate logical checkout dicegah;
-   reload dapat memulihkan state;
-   expired state jelas;
-   disconnect realtime dapat fallback ke durable sync;
-   verified payment memicu authoritative invoice refresh.

------------------------------------------------------------------------

# PHASE FE-7 --- Announcements + Citizen Services

## Resident

-   announcement list/detail;
-   citizen report;
-   attachments;
-   administrative request;
-   status timeline;
-   notifications.

## Management

-   work queue;
-   detail/review;
-   status update;
-   attachment access;
-   scoped filtering.

## Acceptance Gate

-   attachment authorization dihormati;
-   cross-RT data tidak terekspos;
-   notification deep-link kembali ke context yang tepat.

------------------------------------------------------------------------

# PHASE FE-8 --- Patrol + Activities

## Resident Patrol

-   next assignment;
-   schedule/history;
-   submit excuse;
-   excuse status;
-   Billing obligation jika berlaku.

## Management Patrol

-   schedule;
-   team/member assignment;
-   attendance;
-   record excuse on behalf;
-   Billing settlement state.

Patrol tidak memiliki financial truth sendiri.

``` text
Patrol excuse
 ↓
Backend Billing obligation
 ↓
Invoice / Receipt / Allocation
 ↓
FE menampilkan Billing state
```

## Activities

-   activity list/detail;
-   attendance;
-   contribution reference bila backed by Billing.

## Acceptance Gate

-   resident hanya submit untuk assignment eligible miliknya;
-   management action mengikuti scope;
-   fee tidak dihitung authoritative oleh FE;
-   settlement berasal dari Billing;
-   repeated UI action tidak menghasilkan duplicate obligation.

------------------------------------------------------------------------

# PHASE FE-9 --- Marketplace

-   feed;
-   search/filter;
-   detail;
-   create/edit own listing;
-   image upload;
-   sold/inactive;
-   moderation bila authorized.

Tidak ada checkout, escrow, atau shipping pada fase ini.

------------------------------------------------------------------------

# PHASE FE-10 --- CCTV --- HOLD / DEFERRED

Tidak diimplementasikan sekarang.

Jangan menambah streaming dependency atau mengunci asumsi
RTSP/HLS/WebRTC/vendor cloud.

Buka kembali hanya setelah hardware tersedia, backend PoC selesai,
protocol diketahui, dan API contract tersedia.

CCTV bukan blocker pilot.

------------------------------------------------------------------------

## 21. Development Order

``` text
FE-0  Project Foundation
 │
 ▼
FE-1  UI Foundation + Application Shells
 │
 ▼
FE-2  Authentication + Context + RBAC
 │
 ▼
FE-3  Resident + Household + Area
 │
 ▼
FE-4  Billing + Manual Payment + Cashbook
 │
 ▼
FE-5  WiFi + Gallon
 │
 ▼
FE-6  QRIS
 │
 ▼
FE-7  Announcements + Citizen Services
 │
 ▼
FE-8  Patrol + Activities
 │
 ▼
FE-9  Marketplace

FE-10 CCTV [HOLD / DEFERRED]
```

Backend contract readiness tetap dependency. Jangan membuat permanent
frontend-only business API yang berbeda dari OpenAPI backend.

------------------------------------------------------------------------

## 22. Pilot Boundary

Prioritas pilot:

``` text
FE-0 Foundation
FE-1 UI/Shell
FE-2 Auth/Context/RBAC
FE-3 Resident/Household
FE-4 Billing/Manual Payment/Cashbook
FE-5 WiFi/Gallon
FE-6 QRIS
```

FE-7 sampai FE-9 dapat dilanjutkan setelah transactional core stabil.

FE-10 CCTV tetap HOLD.

------------------------------------------------------------------------

## 23. CI / Quality Gates

Setiap pull request minimal menjalankan:

``` text
pnpm install --frozen-lockfile
typecheck
lint
format check
unit/component tests
production build
OpenAPI generated-client drift check
```

Critical integration menambahkan Playwright smoke/E2E.

Jangan merge jika generated API stale, TypeScript gagal, test/build
gagal, atau critical E2E regression ada.

------------------------------------------------------------------------

## 24. Definition of Done

Satu feature belum selesai hanya karena screen sudah terlihat.

Minimum DoD:

-   responsive;
-   mobile behavior checked;
-   desktop management checked jika relevan;
-   generated API contract digunakan;
-   TypeScript strict;
-   loading state;
-   empty state;
-   error state;
-   permission/capability state;
-   scoped context behavior;
-   validation + backend error mapping;
-   critical flow tests;
-   tidak ada sensitive-data leakage;
-   tidak ada unexpected console error;
-   production build lulus;
-   dokumentasi diperbarui.

------------------------------------------------------------------------

## 25. Final Target

Foundation dianggap berhasil bila setiap feature baru mengikuti pola
yang konsisten:

``` text
Feature
├── route
├── generated API contract
├── query/mutation
├── page/components
├── capability rules
├── context handling
├── loading/error/empty states
├── tests
└── documentation
```

Tujuannya bukan sekadar membuat screen pertama cepat, tetapi membuat
setiap feature Rukun berikutnya semakin cepat dibangun tanpa
mengorbankan scoped authorization, financial correctness, security, dan
maintainability.


## Penyerahan account tahap 3 (2026-10-01)

- [x] Panel PrimeVue verifikasi email lintas akses, ID/EN, dark mode.
- [x] Status server, kirim ulang email sendiri, loading/error/retry; sukses kirim ulang tidak mengubah status verifikasi.
- [x] Periksa status tanpa mereset form profil/password yang belum disimpan.
- [x] Unit test kontrak status dan payload; E2E alur verifikasi dengan fixture API.
- [ ] Integrasi email nyata, signed URL/expiry, dan redirect frontend jika disepakati backend.

Checklist: [docs/email-verification-stage.md](docs/email-verification-stage.md).
Penyerahan berhenti pada tahap ini; inbox dan FE-4 belum dimulai.

Validasi tahap 3: **82/82 unit test (21 file), 84/84 E2E Chromium**, TypeScript,
ESLint, Prettier dan production build lulus. Backend email nyata belum diuji.
