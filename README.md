# Rukun Frontend

Vue 3, TypeScript, PrimeVue 4, Tailwind 4, TanStack Vue Query, dan Orval.

## Menjalankan lokal

Gunakan Node 24 (lihat `.nvmrc`) dan pnpm 12.6.0.

```sh
nvm use
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Buka `http://localhost:5173`. Vite meneruskan `/api` ke
`API_PROXY_TARGET` (default backend lokal `https://rukun.p85.test:8443`).
`secure: false` hanya digunakan oleh proxy development untuk sertifikat lokal.
Deployment production membutuhkan reverse proxy HTTPS `/api` ke Laravel.

Jika port 5173 sudah dipakai, gunakan URL yang dicetak Vite. Aplikasi yang berjalan
di port berbeda tidak memakai token localStorage yang sama.

## Validasi

```sh
pnpm api:check
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build-only
pnpm exec playwright install chromium
pnpm test:e2e
```

OpenAPI backend disimpan dalam `openapi/rukun.json`; generated client di
`src/api/generated` tidak diedit manual. Setelah mengganti snapshot kontrak,
jalankan `pnpm api:generate` dan commit keduanya. Backend contract tidak boleh
berisi credential atau token nyata.

## Status

Foundation/auth dan FE-3 tahap 3 sudah tersedia. Context scoped dibaca dari
profil backend; menu management/system juga mengikuti permission global server.
Saat ini fokus berpindah ke FE-4 foundation: billing page, ringkasan tagihan,
route detail invoice, dan koreksi layout/navigasi yang sesuai pola shell yang
sudah ada.

Update terbaru 2 Oktober 2026:
- billing page pada resident/management shell sudah terhubung ke endpoint backend
  yang tersedia di OpenAPI;
- summary tagihan menampilkan outstanding, overdue, dan total aktif;
- detail invoice bisa dibuka dari daftar dengan tombol detail;
- form transfer manual untuk tagihan aktif siap dipakai: pilih rekening tujuan,
  upload bukti transfer, dan kirim payload sesuai kontrak backend;
- halaman pengurus kini punya form pembuatan tagihan massal untuk wilayah/jenis
  tagihan tertentu, dengan opsi daftar rumah tangga tertentu atau seluruh keluarga
  pada wilayah yang dipilih;
- layout halaman tagihan disamakan dengan page-container umum;
- ikon bottom navigation Tagihan sudah muncul kembali;
- label UI menggunakan helper i18n sesuai konvensi proyek.

Gate isolasi scope dan pencabutan akses pada backend nyata masih perlu diverifikasi.

Detail temuan, batas pengujian, dan gate tiap fase ada di
[Audit frontend](docs/frontend-audit.md) serta [Rencana frontend](plan-fe.md).

## Batas pengerjaan per fase

Setelah satu fase/tahap diserahkan, pengembangan berhenti agar Anda dapat menguji.
Fase berikutnya dilanjutkan setelah instruksi Anda. Plan dan README diperbarui
bersama implementasi serta hasil unit test. **Penyerahan saat ini: FE-4 foundation billing
sudah aktif untuk daftar, detail invoice, form transfer manual dengan upload
bukti pembayaran, dan form generate tagihan massal untuk pengurus; remaining FE-4
masih di arah approval queue dan ledger/receipt review.**

## Checklist pengujian manual saat ini

Gunakan akun development yang mempunyai capability terkait. Pengujian penuh
akun scoped RT/RW/Household/Vendor pada backend nyata masih pending. Tidak ada
akun atau password baru yang dibuat oleh pekerjaan frontend ini.

1. Buka `http://localhost:5173`; form login harus tampil tanpa redirect berulang.
2. Login dengan email atau nomor HP. Jika akun wajib mengganti password, halaman
   ganti password harus muncul sebelum halaman bisnis.
3. Jika tersedia lebih dari satu pilihan akses, pilih **Pengelolaan lingkungan**.
4. Buka **Wilayah** (`/manage/areas`): lihat daftar dan buat RW/RT jika berwenang.
   Untuk RT, pilih **RW induk** berdasarkan nama/kode. Select hanya menampilkan RW.
5. Buka **Kartu Keluarga** (`/manage/households`): tambah KK dengan memilih **wilayah RT**;
   buka detail, ubah alamat/blok/nomor/hunian, dan simpan.
6. Dari detail KK, pilih **Lihat anggota keluarga**, lalu **Tambah warga**.
   KK terisi otomatis beserta referensi/alamatnya. Dari form tambah warga langsung,
   pilih KK melalui select. Nama wajib diisi; nomor HP/tanggal lahir opsional. Coba ubah data warga dan
   pastikan perubahan tersimpan setelah reload.
7. Coba filter nama RT, halaman berikut/sebelumnya, input kosong, dan respons
   validasi dari backend. Error harus tampil; NIK/KK tidak diambil otomatis.
8. Coba akun hanya-baca: tombol tambah/simpan harus dibatasi; direct URL tambah
   harus menampilkan halaman akses tidak tersedia.
9. Coba **Keluar**, buka kembali URL protected, dan tes tampilan di layar ponsel.
10. Pada halaman lupa password, uji email. Pemulihan lewat SMS tidak tersedia;
    akun yang hanya memakai nomor HP diarahkan menghubungi pengurus.

Yang **belum tersedia** pada tahap FE-3 ini: integrasi email nyata/deep-link notifikasi,
import/export UI, pengelolaan scoped assignment,
reveal/edit NIK/KK. Menu finansial/layanan belum
ditampilkan sebagai fitur siap pakai.

Tes browser memakai fixture API, sehingga tidak menulis data ke database nyata.
Pengujian manual CRUD di atas memang menulis data development.

## Select referensi, tema, dan bahasa

- Form RT memilih RW induk; form KK memilih RT; form warga memilih KK melalui
  nama/kode atau referensi/alamat. UUID tetap menjadi payload internal API.
- Pencarian select bekerja pada pilihan yang sudah dimuat. Gunakan **Muat pilihan
  berikutnya** untuk mengambil halaman berikutnya (50 record per request).
  Data kosong, izin daftar tidak tersedia, dan kegagalan request ditampilkan;
  request gagal dapat dicoba lagi. Izin baca wilayah/KK diperlukan sesuai referensi.
- Tombol matahari/bulan dan pilihan **ID / EN** tersedia di login/pilih akses serta
  shell pengurus, sistem, warga, dan vendor. Bahasa default **Indonesia (`id`)**;
  tema awal mengikuti sistem. Pilihan manual tersimpan di browser dan bertahan
  setelah reload/logout. Preferensi tidak mengubah hak akses atau data backend.
- Terjemahan mencakup navigasi, formulir, status, validasi lokal, dan empty state
  pada halaman yang sudah tersedia. Nama/alamat data backend dan pesan validasi
  bebas dari backend tetap ditampilkan sesuai respons aslinya.

Tambahan checklist: ganti ID → EN, aktifkan mode gelap, reload, lalu buka form
KK/warga dan pilih akses lain. Coba kembali ke ID/terang, tampilan ponsel,
select kosong, pilihan di halaman berikutnya, dan retry saat jaringan gagal.
Fitur fase selanjutnya tetap belum dikerjakan.

## DataTable bersama

Semua tabel yang tersedia (KK, warga, wilayah) menggunakan `AppDataTable` dari
`@/design-system`, berbasis PrimeVue DataTable. Toolbar, pencarian, loading,
empty/error + retry, jumlah baris termuat, scroll horizontal, dan cursor pagination
berada dalam satu komponen. Halaman fitur hanya menentukan kolom, pencarian pada
field yang relevan, filter bisnis, dan query. Tabel fitur baru mengikuti pola ini.

- KK: alamat sebagai tautan detail, hunian, blok/nomor, status. Nama kepala keluarga
  belum tersedia pada DTO daftar backend; referensi teknis tidak dijadikan identitas tampilan.
- Warga: nama, nomor HP, status, aksi detail. Kolom referensi internal dihapus.
- Wilayah: nama, jenis RW/RT, dan kode wilayah yang dipahami pengurus.
- Klik judul kolom yang memiliki ikon sort; gunakan **Cari di halaman ini** untuk
  mencari alamat/nama/kode/telepon sesuai tabel. Pencarian dan sort hanya berlaku
  pada halaman cursor yang dimuat, serta direset ketika halaman/filter server berubah.
  API belum menyediakan pencarian/sort global dan total baris; UI tidak mengarang total.

Checklist: cari lalu hapus pencarian, coba kata yang tidak cocok, urutkan kolom,
pindah cursor, buka detail dari alamat/nama, serta cek tabel pada ponsel, dark mode,
dan EN. Tes komponen mencakup slot kolom, search/sort/reset, opaque cursor,
loading/error/empty/retry; tes browser memastikan referensi internal tidak tampil.

## Review reuse sebelum fase selanjutnya

UI memprioritaskan PrimeVue langsung. Header memakai Toolbar, error mutasi memakai
Message, status memakai Tag, dan input password memakai Password. Wrapper yang
tersisa menangani pola aplikasi berulang, bukan implementasi ulang primitive.

Logika submit/error/idempotency dan guard unsaved changes kini ada pada composable
bersama. Query select referensi dipisahkan dari view; enum/label form dan tabel
bersumber pada satu katalog domain. Lihat [review komponen](docs/component-review.md)
untuk temuan, perbaikan, batas reuse, dan konvensi implementasi berikutnya.

Tambahan testing manual: ubah dropdown hunian lalu coba tinggalkan form; batalkan
untuk mempertahankan perubahan. Coba toggle password dengan keyboard dan bahasa EN.
Fase berikutnya tetap belum dimulai.

## FE-3 tahap 2: keanggotaan keluarga

Buka **Data Warga → detail warga → Keanggotaan dan riwayat keluarga**.
Akun dengan `residents.view` bisa melihat riwayat yang diizinkan backend.
`residents.manage` diperlukan untuk mutasi; select tujuan/alamat membutuhkan
`households.view`. Pilih keluarga tujuan dan hubungan, atau **Akhiri keanggotaan**,
lalu tinjau konfirmasi sebelum menyimpan. Data warga tidak dihapus.

Alamat riwayat yang dibatasi akses tidak diganti UUID. Setelah mutasi berhasil,
cache community dibersihkan dan profile diperbarui sebelum kembali ke daftar.
Error 403/409 tetap ditampilkan tanpa perubahan optimistis. Semua kontrol memakai
PrimeVue dan komponen/composable bersama yang sudah direview.

[Kontrak, batas, dan checklist testing tahap 2](docs/membership-stage.md).
Tahap ini tidak mencakup import/export ataupun billing.

## FE-3 tahap 3: detail, edit, hapus wilayah

Buka **Wilayah RT/RW → klik nama wilayah**. Akun `areas.view` bisa melihat detail;
`areas.manage` diperlukan untuk mengubah kode/nama atau menghapus wilayah.
Jenis dan RW induk tidak dapat diubah sesuai kontrak backend. Penghapusan
memerlukan konfirmasi; wilayah yang masih dipakai ditolak server dan form tetap
tersedia ketika request gagal.

[Checklist testing tahap 3](docs/area-stage.md).

## Review kontrak sementara — 1 Oktober 2026

`FILE_BE/openapi.json` identik dengan snapshot `openapi/rukun.json`:
**126 path, 155 operasi, 193 schema**. Tidak perlu mengganti generated client.
[Review lengkap FE-0–FE-3](docs/openapi-review-fe0-fe3.md) memetakan endpoint,
fitur tersedia, kekurangan UI, dan gate integrasi.

Yang utama masih terbuka: transport/revocation context, integrasi email nyata,
deep-link notifikasi, import/export,
provisioning akun, assignment, serta sensitive reveal/edit. Context server dan
beranda keluarga sudah tersedia; isolasi scope nyata belum dinyatakan lulus.
FE-4 tetap belum dimulai.

## Tahap auth/bahasa: reset password dan locale API

Tautan email `/reset-password?token=…&email=…` kini membuka form PrimeVue dengan
validasi minimal 12 karakter dan konfirmasi password. Tautan invalid/error backend
memberi jalur meminta tautan baru. Setelah sukses, sesi/cache lokal dan parameter
reset pada URL dibersihkan; pengguna login kembali.

`Accept-Language` kini mengikuti pilihan ID/EN pada setiap request, termasuk
setelah reload; default tetap ID. Penyimpanan locale pada profil server tersedia melalui halaman account. Recovery tetap dapat dibuka saat sesi lama bermasalah.

[Kontrak, batas, dan checklist testing auth/bahasa](docs/auth-recovery-stage.md).
Pengiriman email dan reset password backend nyata perlu diuji manual; otomatis
memakai fixture tanpa mengubah password development.

## Account tahap 1–2

Buka **Menu akun → Akun saya** atau `/account`. Halaman bersama untuk warga,
pengurus, vendor dan system ini menyediakan edit nama/bahasa, ganti password
mandiri, daftar sesi perangkat, pencabutan satu sesi dan logout semua perangkat.
Email/HP hanya ditampilkan karena bukan field edit pada kontrak profil.

Bahasa eksplisit perangkat diutamakan saat login, lalu locale akun, lalu ID.
Simpan profil menerapkan bahasa yang disimpan; toolbar tetap pilihan lokal.
Ganti password mempertahankan sesi ini dan mencabut sesi lain sesuai backend.
Tindakan cabut sesi memakai konfirmasi dan menunggu respons sukses.

[Checklist account tahap 1–2](docs/account-stage.md). Pengujian otomatis memakai
fixture dan tidak mengubah profil/password atau mencabut token development nyata.
UI verifikasi email tersedia pada tahap 3; integrasi email nyata, deep-link notifikasi dan gate scope tetap terbuka; FE-4 belum dimulai.

## Hasil verifikasi — 1 Oktober 2026

| Pemeriksaan                                 | Hasil                                        |
| ------------------------------------------- | -------------------------------------------- |
| Install dari lockfile                       | Lulus (30 September)                         |
| Unit test (Vitest 4, 22 file)               | **88/88 lulus**                              |
| Browser E2E (Chromium)                      | **95/95 lulus**                              |
| TypeScript source Vue dan konfigurasi Node  | Lulus                                        |
| ESLint dan Prettier                         | Lulus                                        |
| Production build + service worker           | Lulus                                        |
| OpenAPI generated-client drift              | Lulus                                        |
| Health backend melalui `localhost:5173/api` | HTTP 200 (30 September)                      |
| Bahasa backend melalui `/api/locales`       | HTTP 200, Content-Language ID/EN (1 Oktober) |

Unit test mencakup session, environment, permission presentation, pembersihan
cache saat logout/context berubah, error normalization, transport generated API,
dan idempotency retry. E2E mencakup login email/HP, redirect, forced password
change, sesi kedaluwarsa, outage/retry, reset email, akses terbatas, CRUD KK,
cursor pagination, validasi server, dan layout mobile. Tambahan tes mencakup
filter jenis referensi, RW pada halaman berikutnya, KK terpilih di luar halaman
pertama, retry select, persistensi bahasa/tema, dan kontrol preferensi di semua shell.

E2E memakai fixture kontrak. Login akun development dan pembacaan daftar backend
nyata telah diperiksa pada iterasi UI; CRUD nyata dan multi-scope backend belum
divalidasi. Shell warga/vendor telah diperiksa lewat component test. CI remote dan uji manual pengguna masih pending.

Tes tambahan tahap 2 mencakup validasi payload, konfirmasi/cancel, pindah/akhiri
keanggotaan, perubahan hubungan dalam KK sama, riwayat cursor/retry, alamat yang
dibatasi akses, read-only, penolakan 403/409, serta mobile dark/EN.

Tes tambahan tahap 3 mencakup payload immutable, batas panjang, edit, cancel/konfirmasi
hapus, read-only, backend errors, retry detail/induk, unsaved guard, serta mobile dark/EN.

Tambahan tahap auth/bahasa: parsing link, minimum/konfirmasi password, payload,
sesi lama, error/reset sukses, header locale, dan persistensi pilihan. Unit suite
lulus dengan `pnpm test --maxWorkers=2`; percobaan worker default sempat timeout
saat proses paralel. Browser memakai build preview: **95/95 lulus**.

Tambahan account tahap 1–2 mencakup validasi profil/password, prioritas bahasa,
akses lintas context, guard dua form, DataTable sesi, cancel/konfirmasi, current/all
logout, error/retry, dan mobile dark EN. Total setelah inbox tahap 1: **88 unit / 95 E2E lulus**.

## Peta kode

- `src/app`: bootstrap, router, layout, config, dan provider Query.
- `src/auth`: API authentication, session abstraction, hydration, dan halaman auth.
- `src/contexts`: presentation context dan capability helper; backend tetap
  menjadi security boundary.
- `src/api/generated`: client/types dari OpenAPI; mutator Axios menjaga response
  envelope backend, mengirim bearer token dan request ID, serta membatasi timeout.
- `src/features/community`: FE-3 tahap 1–3 dan query dengan key context.
- `src/design-system`: komponen reusable di atas PrimeVue/Aura.
- `src/i18n`: locale Indonesia; migrasi seluruh copy halaman ke translation key
  masih perlu dilengkapi.
- `src/pwa`: PWA hanya precache app shell/assets; UI update prompt masih pending.

Server state berada di TanStack Query. Pinia menyimpan context/UI state; token
melalui session abstraction. Generated hooks dibungkus domain query agar scoped
cache tidak memakai key global yang sama.

Untuk menjalankan E2E terhadap build stabil tanpa reload dari perubahan source:

```bash
pnpm build-only
PLAYWRIGHT_PREVIEW=1 pnpm test:e2e --workers=1
```

## Testing Community dengan akun demo

Backend menyediakan `CommunityDemoSeeder` untuk 10 rumah dengan masing-masing 4 warga dan 25 akun lintas role. Jalankan dari proyek backend sesuai README backend; password awal dan daftar email berada pada `storage/app/private/community-demo-accounts.json` backend (file lokal, tidak di-commit).

Contoh login: `demo.warga01@rukun.test` untuk keluarga rumah 01, `demo.ketua.rt01@rukun.test` untuk RT01, atau `demo.admin@rukun.test` untuk seluruh data. FE memakai `contexts` dari login/me untuk pilihan wilayah/keluarga tanpa membutuhkan permission global pada akun scoped. Halaman `/app/home` menampilkan alamat dan anggota keluarga dari API sesuai household konteks aktif. Server tetap memeriksa akses setiap request.

## Account tahap 3 — verifikasi email

Buka `/account` untuk melihat status email, meminta kirim ulang, lalu memeriksa
status setelah membuka tautan asli dari email. Pemeriksaan tidak menghapus isian
profil/password yang belum disimpan. Tersedia ID/EN dan dark mode lintas akses.

Sukses kirim ulang hanya berarti permintaan diterima. Tautan bertanda tangan tetap
menuju backend; pengiriman email dan klik tautan nyata belum diuji otomatis.
[Checklist dan batas integrasi](docs/email-verification-stage.md).

Validasi tahap 3: **82/82 unit test (21 file), 84/84 E2E Chromium**, typecheck,
ESLint, Prettier, dan production build lulus. Delapan E2E baru mencakup status,
kirim ulang, error/retry, perlindungan isian belum disimpan, dan mobile dark EN.

## Inbox notifikasi tahap 1

Buka **Menu akun → Notifikasi** atau `/notifications` (lintas jenis akses).
`/app/notifications` kini mengarah ke inbox yang sama. Tersedia DataTable, filter
kategori/status, cursor pagination, detail, jumlah belum dibaca, tandai
dibaca/belum dibaca, serta konfirmasi tandai semua dibaca. ID/EN dan dark mode
tersedia; isi pesan diterjemahkan backend.

[Checklist inbox dan batas integrasi](docs/notifications-stage.md). Pengujian
otomatis memakai fixture; notifikasi nyata tidak diubah. Preferensi kanal
dilanjutkan pada tahap 2 di bawah. Hapus pesan, deep-link context, dan FE-4 belum
dikerjakan.

Validasi inbox tahap 1: **88/88 unit test (22 file), 95/95 E2E Chromium**,
typecheck, ESLint, Prettier, dan production build lulus.

## Preferensi notifikasi tahap 2

Buka **Notifikasi → Preferensi notifikasi** (`/notifications/preferences`).
Atur kanal Inbox aplikasi/Email melalui PrimeVue ToggleSwitch dan DataTable.
Kanal wajib mengikuti server dan tidak bisa dimatikan. Simpan hanya mengirim
kategori yang berubah; error mempertahankan pilihan, dan navigasi dengan edit
belum tersimpan dilindungi konfirmasi. ID/EN serta dark mode tersedia.

[Checklist preferensi dan batas integrasi](docs/notification-preferences-stage.md).
Persistensi dan pengiriman notifikasi nyata belum diuji otomatis.
