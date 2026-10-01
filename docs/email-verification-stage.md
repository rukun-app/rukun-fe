# Account tahap 3 — verifikasi email

Penyerahan 1 Oktober 2026, melalui **Menu akun → Akun saya** (`/account`),
tersedia untuk semua jenis akses. UI memakai PrimeVue, bahasa ID/EN, dan tema terang/gelap.

- Status mengikuti `email_verified_at` dari server: tanggal valid berarti terverifikasi,
  `null` berarti belum; field yang tidak dikirim berarti status belum tersedia.
- Kirim ulang hanya untuk email akun sendiri yang eksplisit belum terverifikasi.
  Respons sukses berarti permintaan diterima, bukan bukti email terkirim atau terverifikasi.
- Tombol **Periksa status email** mengambil ulang profil tanpa menghapus perubahan
  pada form profil/password. Hasil pemeriksaan hanya memperbarui panel verifikasi.
- Loading mencegah permintaan ganda dan benturan dengan penyimpanan profil/password/sesi;
  kegagalan menampilkan error dan menyediakan retry.

## Checklist manual

1. Buka `/account` dengan email belum terverifikasi, klik kirim ulang, periksa inbox/spam.
2. Buka tautan asli dari email. Kembali ke frontend dan klik Periksa status email.
3. Pastikan label berubah hanya setelah server mengembalikan timestamp terverifikasi.
4. Isi perubahan nama/password tanpa menyimpan, periksa status: isian tetap utuh dan
   konfirmasi meninggalkan halaman masih berlaku.
5. Uji tautan kedaluwarsa: kembali ke akun dan minta kirim ulang.
6. Uji akun tanpa email, status tidak tersedia, rate limit, dark mode, dan bahasa EN di mobile.

## Batas integrasi

Kontrak memakai POST `/auth/email/resend` publik dan GET
`/auth/email/verify/{id}/{hash}` dengan signature backend. Frontend tidak mengubah
host/path/query tautan bertanda tangan, tidak memanggil endpoint verify secara otomatis,
dan tidak membuat route callback verifikasi sendiri. Backend saat ini membalas JSON;
redirect kembali ke frontend memerlukan kesepakatan kontrak backend.

Pengujian browser memakai fixture API, tanpa mengirim email nyata atau memverifikasi
akun nyata. Pengiriman email, signature/expiry, serta klik tautan pada backend development
masih memerlukan pengujian integrasi manual. Inbox dan FE-4 belum dimulai.

Validasi: **82/82 unit test (21 file), 84/84 E2E Chromium**, typecheck, lint,
format check dan production build lulus. Lima unit test dan delapan E2E baru
menguji kontrak status/payload, error/retry, isian form, dan mobile dark EN.
