# Rukun — Frontend

Sistem manajemen RT/RW: iuran, pengumuman, keamanan lingkungan, dan layanan warga — dalam satu aplikasi Progressive Web App.

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Memulai](#memulai)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Struktur Proyek](#struktur-proyek)
- [Arsitektur](#arsitektur)
- [API Client & Generated Types](#api-client--generated-types)
- [State Management](#state-management)
- [Routing & Guard](#routing--guard)
- [Internasionalisasi (i18n)](#internasionalisasi-i18n)
- [PWA](#pwa)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Progress Fase](#progress-fase)

---

## Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | Vue 3.5 + TypeScript strict |
| Build | Vite 8 (rolldown) |
| UI Library | PrimeVue 4 — Styled Mode + Aura preset |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`, tanpa config file) |
| Server State | TanStack Vue Query v5 |
| Client State | Pinia v2 |
| Router | Vue Router v4 |
| HTTP | Axios — custom instance dengan interceptors |
| API Types | Orval (OpenAPI → TypeScript + TanStack Query) |
| Validasi | Zod v3 (env validation + form schema) |
| i18n | vue-i18n v11 — Composition API mode |
| PWA | vite-plugin-pwa (Workbox, `registerType: 'prompt'`) |
| Unit Test | Vitest 3 + jsdom |
| E2E Test | Playwright |
| Linting | ESLint 9 flat config + eslint-plugin-vue + eslint-plugin-playwright |
| Formatting | Prettier |
| Package Manager | pnpm 12 |

---

## Prasyarat

- **Node.js** `^22.18.0` atau `>=24.12.0`
- **pnpm** `>=12.0.0`

Pasang pnpm jika belum ada:

```sh
npm install -g pnpm
# atau
corepack enable && corepack prepare pnpm@latest --activate
```

---

## Memulai

```sh
# 1. Clone repo
git clone <repo-url> rukun-fe
cd rukun-fe

# 2. Install dependencies (dari lockfile)
pnpm install

# 3. Salin file env dan isi nilainya
cp .env.example .env.local

# 4. Jalankan dev server
pnpm dev
```

Buka `http://localhost:5173` di browser.

---

## Environment Variables

Salin `.env.example` ke `.env.local` dan sesuaikan:

```env
# Base URL backend API (tanpa trailing slash)
VITE_API_BASE_URL=http://localhost:3000

# App environment: development | staging | production
VITE_APP_ENV=development
```

> **Penting:** Semua variabel `VITE_*` akan terbundle ke client. Jangan simpan secret di sini.

Validasi env dijalankan saat startup via Zod (`src/app/config/env.ts`). App akan throw dan tidak mount jika ada variabel yang tidak valid.

---

## Scripts

| Script | Perintah | Keterangan |
|--------|----------|------------|
| Dev server | `pnpm dev` | Hot-reload di `localhost:5173` |
| Build produksi | `pnpm build` | TypeCheck + Vite build |
| Build saja | `pnpm build-only` | Vite build tanpa typecheck |
| Preview build | `pnpm preview` | Preview hasil dist |
| Type check | `pnpm typecheck` | `vue-tsc --noEmit` |
| Lint | `pnpm lint` | ESLint flat config |
| Format | `pnpm format` | Prettier write |
| Format check | `pnpm format:check` | Prettier check (untuk CI) |
| Unit test | `pnpm test` | Vitest run (single pass) |
| Unit test watch | `pnpm test:watch` | Vitest watch mode |
| E2E test | `pnpm test:e2e` | Playwright (requires dev server) |
| Generate API | `pnpm api:generate` | Orval → `src/api/generated/` |

---

## Struktur Proyek

```
rukun-fe/
├── e2e/                        # Playwright E2E tests
│   └── smoke.spec.ts
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── client/
│   │   │   └── http.ts         # Axios instance + interceptors
│   │   ├── errors/
│   │   │   ├── types.ts        # NormalizedApiError, ApiFieldErrors
│   │   │   └── normalizer.ts   # normalizeApiError(), isApiError()
│   │   └── generated/          # ⚠️ Auto-generated oleh Orval — jangan edit manual
│   ├── app/
│   │   ├── bootstrap/
│   │   │   └── index.ts        # createApp factory + semua plugins
│   │   ├── config/
│   │   │   ├── env.ts          # Zod env validation
│   │   │   └── env.test.ts     # Smoke test env validation
│   │   ├── layouts/
│   │   │   └── PlaceholderPage.vue
│   │   ├── providers/
│   │   │   └── query.ts        # TanStack Query client
│   │   └── router/
│   │       └── index.ts        # Routes + RouteMeta types + global guard
│   ├── assets/
│   │   └── main.css            # @import "tailwindcss"
│   ├── auth/
│   │   └── stores/
│   │       └── session.ts      # getToken / setToken / clear
│   ├── contexts/
│   │   └── stores/
│   │       └── context.ts      # Pinia context store + can()
│   ├── design-system/          # (FE-1) Shared UI primitives
│   ├── features/               # (FE-2+) Feature modules
│   ├── i18n/
│   │   ├── index.ts            # vue-i18n setup
│   │   └── locales/
│   │       └── id.ts           # Bahasa Indonesia
│   ├── pwa/                    # (FE-0) PWA helpers
│   ├── shared/                 # Shared composables, utils
│   ├── App.vue                 # Root — hanya <RouterView />
│   └── main.ts                 # Entry point → bootstrap()
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── .npmrc
├── .prettierrc
├── eslint.config.ts
├── orval.config.ts
├── package.json
├── playwright.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Arsitektur

### Bootstrap Chain

```
main.ts
  └── bootstrap()                    src/app/bootstrap/index.ts
        ├── createApp(App)
        ├── createPinia()
        ├── useContextStore()          src/contexts/stores/context.ts
        ├── setContextIdProvider()     → wires context → Axios header
        ├── router                     src/app/router/index.ts
        ├── i18n                       src/i18n/index.ts
        ├── installQuery(app)          src/app/providers/query.ts
        ├── PrimeVue + Aura
        ├── ToastService
        ├── ConfirmationService
        └── app.mount('#app')
```

### HTTP Layer

File: `src/api/client/http.ts`

Axios instance dengan tiga request interceptors:

| Header | Sumber |
|--------|--------|
| `Authorization: Bearer <token>` | `session.getToken()` |
| `X-Rukun-Context: <contextId>` | `contextIdProvider()` (Pinia store) |
| `X-Request-ID: <uuid>` | `crypto.randomUUID()` |

Response interceptor menangkap error dan melempar `NormalizedApiError`.

### Context & RBAC

- `contextStore.activeContextId` dikirim di setiap request sebagai `X-Rukun-Context`.
- `can("permission.string")` memeriksa capabilities dari context aktif — digunakan untuk sembunyikan/tampilkan UI element, bukan sebagai security boundary.
- Security boundary tetap di backend.

### API Error Normalization

Semua error Axios dinormalisasi ke `NormalizedApiError`:

```ts
{
  code: string        // e.g. "PAYMENT_ALREADY_PROCESSED"
  message: string     // pesan user-friendly
  fieldErrors?: Record<string, string[]>  // validasi field
  requestId?: string  // X-Request-ID untuk debugging
  httpStatus: number
}
```

---

## API Client & Generated Types

Tipe API dan query hooks di-generate otomatis dari OpenAPI spec backend:

```sh
pnpm api:generate
```

Output: `src/api/generated/` — **jangan edit manual.**

Konfigurasi Orval ada di `orval.config.ts`. Path ke OpenAPI spec backend default ke `../rukun-be/docs/openapi.yaml`.

CI job `api-drift` (currently disabled, enable saat BE ada sebagai submodule) akan gagal jika generated types berbeda dari yang di-commit — mencegah API drift.

---

## State Management

| Store | File | Isi |
|-------|------|-----|
| Session | `src/auth/stores/session.ts` | Token storage abstraction (`getToken/setToken/clear`) |
| Context | `src/contexts/stores/context.ts` | Active context, available contexts, `can()`, `switchContext()` |

> Session store sengaja **bukan** Pinia store — cukup object biasa di atas localStorage. Ini memudahkan migrasi ke httpOnly cookie di masa depan tanpa mengubah consumer.

---

## Routing & Guard

Semua route ada di `src/app/router/index.ts`. Route meta di-augment dengan:

```ts
interface RouteMeta {
  requiresAuth?: boolean
  contextTypes?: ContextType[]
  requiredCapabilities?: string[]
}
```

Global navigation guard:
- Redirect ke `/auth/login` jika route `requiresAuth: true` dan tidak ada token.
- Selebihnya guard kapabilitas dilakukan di dalam masing-masing feature (per-route guard).

---

## Internasionalisasi (i18n)

- Bahasa default: **Bahasa Indonesia** (`id`)
- Mode: Composition API (`legacy: false`)
- Locale file: `src/i18n/locales/id.ts`

Untuk menambah string baru, tambahkan key di file locale kemudian gunakan `useI18n()` di component.

---

## PWA

- `registerType: 'prompt'` — user diminta konfirmasi sebelum update dipasang.
- Workbox pre-cache: semua `js`, `css`, `html`, `ico`, `png`, `svg`, `woff2`.
- API calls (`/api/*`) dikecualikan dari service worker.
- Update prompt akan diimplementasikan di FE-1.

---

## Testing

### Unit Tests

```sh
pnpm test
```

Vitest + jsdom. File test: `src/**/*.test.ts`.

### E2E Tests

```sh
# Pastikan dev server sudah jalan, atau Playwright akan menjalankannya otomatis
pnpm test:e2e
```

Playwright dengan Chromium. Test ada di `e2e/`.

---

## CI/CD

`.github/workflows/ci.yml` menjalankan:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm format:check`
4. `pnpm test`
5. `pnpm build-only`

Job `api-drift` (disabled) akan aktif saat BE repo tersedia sebagai submodule — memeriksa apakah generated types sudah sinkron dengan OpenAPI spec terbaru.

---

## Progress Fase

Lihat [`plan-fe.md`](./plan-fe.md) untuk detail lengkap setiap fase.

| Fase | Nama | Status |
|------|------|--------|
| **FE-0** | Project Foundation | ✅ Selesai |
| **FE-1** | UI Foundation & Application Shells | ✅ Selesai |
| **FE-2** | Authentication + Context + RBAC | ✅ Selesai |
| **FE-3** | Resident + Household + Area | 🔜 Berikutnya |
| **FE-4** | Billing + Manual Payment + Cashbook | ⏳ Belum dimulai |
| **FE-5** | WiFi + Gallon | ⏳ Belum dimulai |
| **FE-6** | QRIS / Payment Gateway | ⏳ Belum dimulai |
| **FE-7** | Announcements + Citizen Services | ⏳ Belum dimulai |
| **FE-8** | Patrol + Activities | ⏳ Belum dimulai |
| **FE-9** | Marketplace | ⏳ Belum dimulai |
| **FE-10** | CCTV | 🚫 Ditunda |

---

## IDE Setup

- **VS Code** + ekstensi [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (nonaktifkan Vetur jika ada)
- Pastikan TypeScript language service menggunakan versi TypeScript dari `node_modules` (Workspace version), bukan bawaan VS Code

### Browser DevTools

- Chrome/Edge: [Vue DevTools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) + aktifkan Custom Object Formatters
- Firefox: [Vue DevTools for Firefox](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
