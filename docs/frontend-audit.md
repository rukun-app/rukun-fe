# Audit frontend — 30 September 2026

## Penyebab aplikasi tidak dapat dibuka

Guard lama memakai `to.matched.some(r => r.meta.requiresAuth !== false)`.
Layout `/auth` tidak memiliki nilai `requiresAuth`; `undefined !== false` membuat
login dianggap protected dan mengarah ke login lagi. Guard sekarang membaca
metadata gabungan Vue Router, menunggu hydration profil sebelum memeriksa akses,
dan menangani kegagalan hydration dengan halaman retry.

Masalah lain yang diperbaiki:

- InputText/Button di halaman auth belum diimpor; PrimeVue tidak mendaftarkan semua komponen otomatis.
- Login tidak mengembalikan `contexts`; `/auth/me` mengembalikan profil langsung dalam `data`, bukan `data.user`.
- Forgot-password membutuhkan `email`, bukan `identifier`; SMS reset tidak tersedia.
- HTTP belum memiliki timeout; request sekarang dibatasi 15 detik.
- Token expiry/logout/context switch belum membersihkan cache server state.
- `vue-tsc --noEmit` menunjuk tsconfig root dengan `files: []`, sehingga laporan tanpa error sebelumnya bukan pemeriksaan source aplikasi.
- Orval menunjuk file backend yang tidak ada dan Axios mutator belum sesuai return type generated contract.
- API drift CI dinonaktifkan; browser smoke sebelumnya hanya memeriksa judul halaman.
- PrimeIcons dan integrasi token warna Tailwind/PrimeVue belum terpasang.

## Kontrak aktual dan batas akses

Snapshot `openapi/rukun.json` diambil dari backend development pada 30 September
2026 (126 paths). Backend live lebih maju daripada salinan `FILE_BE`: endpoint
settlement/galon sudah tercantum. Keberadaan endpoint tidak membuktikan seluruh
gate bisnis sudah lulus.

Pembacaan `Modules/Identity/Http/AuthController.php` pada backend mengonfirmasi
bahwa `userData()` hanya mengekspor permission global. Tidak ada endpoint context
atau validasi `X-Rukun-Context` dalam kontrak yang tersedia.

Frontend sementara menyediakan pilihan presentation management/system hanya
jika **permission global aktual** mendukungnya. Pilihan ini tidak mengklaim sebagai
scope RT/RW dan tidak mengirim header context buatan. Role name tidak digunakan
untuk mengasumsikan permission. Akun tanpa permission global mendapatkan halaman
akses kosong yang dapat ditutup dengan logout, bukan loading tanpa akhir.

Untuk menyelesaikan FE-2/FE-3 scoped, backend perlu menyediakan kontrak terverifikasi:

1. Daftar context milik actor: ID stabil, type, label, scope type/public UUID, capabilities efektif.
2. Context mencakup assignment temporal aktif serta membership household milik actor; global permissions tidak ditempelkan sembarangan ke context scoped.
3. Validasi `X-Rukun-Context` pada request domain, tidak mempercayai ID dari client.
4. Stable error code untuk context invalid/revoked/expired.
5. Schema OpenAPI dan test pengguna multi-assignment, RW inheritance, cross-RT denial, vendor isolation, dan revoked assignment.

Tidak ada perubahan backend dilakukan dalam pekerjaan frontend ini.

## Audit tiap fase

| Fase  | Hasil pemeriksaan / pekerjaan                                                                                                                                   | Gate yang masih terbuka                                                                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE-0  | Client/types Orval dari snapshot aktual, proxy `/api`, timeout, typecheck source, pinned pnpm, CI/drift check                                                   | CI remote belum dijalankan                                                                                                                               |
| FE-1  | Komponen auth terpasang, token warna/icons terhubung, sidebar mobile, logout/switch access                                                                      | Audit keyboard/a11y seluruh shell; bukan hanya login/dashboard                                                                                           |
| FE-2  | Login email/HP, profile hydration, initial password guard, session expiry/retry, email recovery, capability guard dan cache cleanup                             | Context scoped backend, validasi multi-scope/revocation end-to-end                                                                                       |
| FE-3  | Tahap awal: dashboard pengurus, daftar/detail/create/update Household/Resident, cursor pagination, daftar/create wilayah, Zod forms, error/loading/empty states | Warga/home household, profile/inbox, mutasi membership, import/export UI, scoped assignments, sensitive reveal, CRUD wilayah lengkap; gate isolasi scope |
| FE-4  | API Billing tersedia; belum diimplementasikan FE                                                                                                                | FE-2/3 scoped dan seluruh financial journeys                                                                                                             |
| FE-5  | API WiFi/galon tercantum pada backend live; FE belum diimplementasikan                                                                                          | Verifikasi readiness backend dan FE-4                                                                                                                    |
| FE-6  | Foundation Payments tersedia; integrasi Billing/QRIS belum terbukti siap                                                                                        | Contract invoice checkout/reservation/verified receipt                                                                                                   |
| FE-7  | Pengumuman/layanan warga belum tersedia pada snapshot ini                                                                                                       | Backend F6                                                                                                                                               |
| FE-8  | Ronda/kegiatan belum tersedia pada snapshot ini                                                                                                                 | Backend F7                                                                                                                                               |
| FE-9  | Marketplace belum tersedia pada snapshot ini                                                                                                                    | Backend F8                                                                                                                                               |
| FE-10 | HOLD sesuai rencana                                                                                                                                             | Hardware dan PoC                                                                                                                                         |

FE-3 tidak ditandai selesai dan pekerjaan tidak dilanjutkan ke transaksi finansial
sebelum fondasi scope siap. NIK/KK tidak dibaca dari list/detail dan tidak dimuat
sebelum tersedia flow sensitive khusus. Endpoint yang belum siap tidak digantikan
dengan mock production atau perhitungan bisnis di frontend.

## Pengujian

E2E menggunakan response fixtures yang mengikuti schema backend, tanpa membuat
akun/transaksi pada database development. Health check melalui proxy `/api`
dilakukan ke backend live. Login akun development dan GET daftar telah diperiksa pada iterasi UI. CRUD
nyata dan validasi multi-scope backend belum dilakukan; ini belum merupakan
pengujian integrasi penuh.

Client generated harus dihasilkan kembali dengan `pnpm api:generate` setiap
snapshot kontrak diperbarui, kemudian `pnpm api:check`. Check ini mendeteksi drift
terhadap snapshot versioned, bukan polling backend live pada setiap CI run.

## Hasil penyerahan tahap ini

Pada Node 24: install frozen lockfile, typecheck aplikasi/config, lint, format,
production build, dan OpenAPI drift check lulus. Vitest: **39 unit/component test / 10 file
lulus**. Playwright Chromium: **26 test lulus**. Login dan dashboard mobile
juga diperiksa secara visual dari screenshot browser.

Sesuai arahan pengguna, pekerjaan berhenti pada perbaikan foundation/auth dan
FE-3 tahap 1 untuk testing manual. Pengembangan bagian FE-3 berikutnya maupun
FE-4 memerlukan instruksi lanjutan pengguna. Tidak ada klaim seluruh fase selesai.

## Penyempurnaan tahap 1: referensi dan preferensi UI

UUID manual diganti select RW/RT/KK dengan label, pencarian pada data termuat,
cursor load-more, dan retry. ID tetap dikirim melalui DTO generated. Tema gelap
dan bahasa ID/EN (default ID) tersedia pada auth dan semua shell; preferensi
tersimpan di localStorage tanpa menyimpan data referensi. Browser fixture menguji
management/system/auth; component test mencakup shell warga/vendor karena
backend belum mengekspor context scoped. Fase berikutnya belum dimulai.

## Konsolidasi DataTable

Tabel KK/warga/wilayah memakai AppDataTable bersama dari design system. Kolom
referensi teknis tidak ditampilkan; identitas KK menggunakan alamat yang tersedia
di DTO, warga menggunakan nama. Search dan sort terbatas halaman cursor dan
berlabel eksplisit; backend belum menyediakan search/sort global maupun total.
Tidak ada request per baris untuk menebak kepala keluarga. Test mencakup reusable
states, slots, search/sort reset, pagination, dan keterbacaan kolom di browser.
