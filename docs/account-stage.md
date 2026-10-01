# Account — profil, bahasa dan keamanan sesi

Tahap 1 (1 Oktober 2026): **Menu akun → Akun saya**, atau `/account`.
`/app/account` mengarah ke halaman yang sama. Pengguna login dari akses warga,
pengurus, vendor, system, maupun tanpa context dapat mengelola akun sendiri.
Initial-password guard tetap berlaku.

## Profil dan bahasa

- GET `/auth/me`, PATCH `/auth/profile`; hanya `name` dan `locale` dikirim.
  Email/HP ditampilkan read-only. Nama wajib, trim, maksimum 100 mengikuti
  validasi backend. Tidak ada perubahan role, scope atau identifier login.
- State nama/context diperbarui dari respons server, bukan optimistis.
  Kegagalan mempertahankan isian dan menampilkan field errors.
- Menyimpan bahasa akun menerapkan locale respons server ke UI dan pilihan lokal.
  Toolbar bahasa hanya mengatur perangkat, tidak PATCH profil diam-diam.
- Saat hydration/login: pilihan eksplisit perangkat > locale profil > ID.
  Tanpa preferensi akun/perangkat, default tetap ID. Locale akun yang diterapkan
  otomatis tidak disimpan sebagai pilihan eksplisit sehingga pergantian akun
  tetap mengikuti profil jika pengguna belum memilih bahasa sendiri.

## Password mandiri

PUT `/auth/password` membutuhkan password saat ini, password baru minimum 8
karakter, konfirmasi sama dan password berbeda. Password tidak di-trim.
Backend memverifikasi password lama dan mencabut sesi lain; sesi saat ini tetap
aktif. Form password dibersihkan hanya setelah server menyatakan sukses.
Reset dari email tetap memakai minimum 12 pada endpoint yang berbeda.

Kedua form memakai PrimeVue, shared submit/error/password accessibility dan satu
unsaved guard. Simpan profil tidak menghilangkan isian/guard password yang belum
disimpan, begitu juga sebaliknya. Tidak ada submit bersamaan.

## Checklist profil/password

1. Buka Akun saya dari setiap jenis akses. Email/HP bukan field edit.
2. Ubah nama dan bahasa lalu simpan; periksa nama di menu akun dan bahasa UI.
3. Coba nama kosong dan error backend; isian tetap, nama/bahasa aplikasi tidak
   berubah sebelum respons sukses.
4. Coba password lama salah, terlalu pendek, sama, atau konfirmasi berbeda.
5. Pada akun development, ganti password dan pastikan perangkat ini tetap masuk,
   perangkat lain perlu login ulang. Pengujian ini benar-benar mengubah password.
6. Isi kedua form, simpan hanya salah satunya, lalu coba keluar dan batalkan
   konfirmasi; perubahan form lainnya harus tetap ada.
7. Uji bahasa profil pada browser baru; pilihan bahasa eksplisit perangkat tetap
   lebih tinggi prioritasnya. Periksa dark mode dan ponsel.

Pengujian otomatis memakai fixture; tidak mengubah profil/password akun nyata.
Verifikasi email, inbox, gate scope nyata dan billing masih terpisah.

## Tahap 2: sesi perangkat

Setelah tahap 1 lulus pemeriksaan, pengguna meminta melanjutkan tahap berikutnya.

- `AccountSessions` memakai AppDataTable/PrimeVue dan endpoint GET `/auth/tokens`,
  DELETE `/auth/tokens/{token}`, POST `/auth/logout-all`.
- Tabel menampilkan nama dari server, penanda `is_current`, tanggal dibuat,
  penggunaan terakhir dan kedaluwarsa. Tidak menampilkan ID atau isi bearer
  token. Nama dapat sama di beberapa perangkat; jangan menebak browser/IP yang
  tidak disediakan kontrak. Tanggal yang kosong/invalid ditampilkan “—”.
- API mengembalikan seluruh sesi milik akun tanpa cursor; search/sort DataTable
  berlaku pada daftar yang dimuat. Error/retry dan keadaan kosong tersedia.
- Pencabutan selalu memakai ConfirmDialog. Target menggunakan ID dan penanda
  current dari snapshot metadata saat ditinjau; cancel tidak mengirim request.
- Cabut perangkat lain: setelah sukses, refresh daftar, tetap login di perangkat
  ini. Cabut perangkat ini atau semua perangkat: setelah sukses, bersihkan
  sesi/context/cache dan ke halaman login. Tidak ada optimistic deletion/logout.
- Form dan tindakan sesi saling dikunci selama submit/konfirmasi. Jika akan
  logout dan ada perubahan belum disimpan, dampaknya disebutkan di konfirmasi.
  Guard dibersihkan hanya setelah logout berhasil; error tetap menjaga isian.
- Ganti password juga memuat ulang daftar sesi karena backend mencabut sesi lain.
- 404/5xx ditampilkan sebagai error dan bisa diikuti muat ulang; 401 memakai
  penanganan sesi kedaluwarsa yang sudah ada. Endpoint tetap memeriksa ownership.
- Formatter tanggal dipakai bersama riwayat membership dan daftar sesi.

## Checklist sesi

1. Buka Akun saya, gulir ke Sesi perangkat. Bandingkan nama/tanggal dan penanda
   perangkat ini; coba search, dark mode, bahasa EN serta scroll tabel di ponsel.
2. Klik Cabut sesi perangkat lain, lalu Batal: perangkat tetap terdaftar.
3. Konfirmasi cabut sesi perangkat lain; perangkat ini tetap aktif dan daftar
   diperbarui. Perangkat yang dicabut harus login kembali.
4. Isi perubahan profil, lalu pilih cabut perangkat ini atau keluar semua.
   Periksa peringatan perubahan belum disimpan dan batalkan dahulu.
5. Konfirmasi: halaman login muncul setelah server berhasil; jangan memakai akun
   production untuk percobaan. Uji error/timeout untuk memastikan UI tidak mengaku
   sukses sebelum respons server.
6. Ganti password, lalu periksa daftar sesi terbaru.

Pengujian otomatis tahap 2 tidak mencabut token akun development nyata.
Verifikasi email, inbox, isolasi scope nyata, serta FE-4 belum dilanjutkan.

Verifikasi gabungan: **77/77 unit test (20 file), 76/76 E2E Chromium lulus**,
typecheck dan build lulus. Semua uji mutasi otomatis memakai fixture.
