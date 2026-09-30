# Tahap auth/bahasa — 1 Oktober 2026

Tahap ini dipilih pengguna setelah FE-3 tahap 3. Cakupan: penyelesaian reset
password dan bahasa request API. FE-4 belum dimulai; gate context/scoped tetap
terbuka.

## Alur reset password

- Email backend memakai `/reset-password?token=…&email=…`; frontend menerima
  alamat itu serta `/auth/reset-password?token=…&email=…` pada halaman yang sama.
- Tautan tanpa token/email valid atau parameter berulang menampilkan pesan dan
  pilihan meminta tautan baru. Tidak ada request reset saat halaman dibuka.
- Form memakai PrimeVue Form/Password/InputText/Message/Button, Zod, shared
  submission/error dan aksesibilitas toggle password yang sudah tersedia.
- Payload hanya token, email, password, password_confirmation. Email dinormalisasi
  menjadi lowercase/trim; password dipertahankan persis, minimal **12 karakter**,
  dan konfirmasi sama. Initial password change tetap mengikuti kontrak terpisah
  (minimal 8); tahap ini tidak menyamakan kedua aturan.
- POST `/api/auth/reset-password` dipanggil satu kali saat submit valid; kontrol
  dikunci selama request. Tidak ada retry otomatis atau klaim replay idempotency.
- Error/field errors backend ditampilkan, termasuk token expired/used, validasi,
  rate limit, dan outage. Form bisa dicoba kembali atau meminta tautan baru.
  Kegagalan tidak menghapus sesi lokal yang sudah ada.
- Setelah server mengonfirmasi sukses, sesi/context/cache lokal dibersihkan,
  input password ditutup dan token/email dibuang dari URL aktif melalui replace.
  Pengguna diminta login kembali. Backend menangani perubahan password dan
  pencabutan token akun; frontend tidak melakukan login otomatis.
- Reset dan lupa password adalah route publik yang tidak menunggu hydration sesi
  lama. Login/forgot/reset tidak mengirim bearer/context lama; kegagalan 401 pada
  endpoint publik ini tidak menghapus sesi lain. Route protected tetap memakai
  guard dan penanganan 401 yang ada.
- Password/token reset tidak disimpan ke localStorage/sessionStorage atau query
  cache aplikasi. Token tetap berada pada tautan sampai reset sukses. Request
  dibatalkan saat halaman ditinggalkan; response lama tidak menyelesaikan alur
  untuk tautan lain yang baru dibuka.

## Bahasa

`Accept-Language` ditetapkan dari locale UI pada **setiap request Axios**, sehingga
berpindah ID → EN → ID langsung berlaku untuk request berikutnya, termasuk
login, recovery dan endpoint domain. Default ID; pilihan lokal bertahan setelah
reload. Jika penyimpanan preferensi gagal, pilihan dalam memori tetap dipakai.
Request yang sudah dikirim tidak diubah ulang dan data cache yang sudah ada tidak
otomatis di-fetch ulang hanya karena bahasa berubah.

Pesan backend tidak diterjemahkan ulang oleh frontend. Server tetap menentukan
bahasa response sesuai aturan locale-nya. Pemeriksaan GET `/api/locales` melalui
proxy development mengembalikan HTTP 200 dan `Content-Language: id`/`en` sesuai
header yang dikirim. Default backend masih EN, tetapi frontend tetap ID sesuai
preferensi pengguna. Sinkronisasi locale melalui
`PATCH /auth/profile` belum dikerjakan; ini bagian tahap account berikutnya.
Tidak ada PATCH profil otomatis ketika pengguna mengganti bahasa pada toolbar.

## Checklist manual

1. Minta tautan di halaman lupa password menggunakan email akun development;
   buka email lalu tautannya. `FRONTEND_URL` backend harus menunjuk alamat frontend
   yang dapat dibuka. Pengiriman email nyata tidak diuji oleh fixture browser.
2. Coba kata sandi <12 karakter dan konfirmasi berbeda: tidak boleh submit.
3. Masukkan password baru yang valid dan berbeda dari sebelumnya; setelah sukses,
   login kembali dengan password baru. Password akun development akan berubah.
4. Buka ulang tautan yang sudah dipakai atau expired; periksa error server dan
   kemampuan meminta tautan baru. Tautan tanpa parameter harus menampilkan pesan
   invalid, bukan loading terus-menerus.
5. Uji dengan sesi lama/expired, ponsel, dark mode dan ID/EN.
6. Ganti bahasa; periksa `Accept-Language` di Network untuk request berikutnya,
   lalu reload dan ulangi. Default browser tanpa preferensi tetap ID.

Unit test mencakup parsing link, payload/validasi dan transport bahasa/auth.
Browser fixture mencakup sukses, invalid/expired, 422/429/500, duplicate submit,
sesi lama/outage, dark mobile EN, serta header bahasa setelah switch/reload.
Tidak ada password akun development yang diubah selama pengujian otomatis.
