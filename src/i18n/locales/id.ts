// Bahasa Indonesia — default locale
// Existing semantic messages; current UI copy is translated through tr() in ../index.ts.
const id = {
  common: {
    loading: 'Memuat...',
    error: 'Terjadi kesalahan',
    retry: 'Coba lagi',
    cancel: 'Batal',
    confirm: 'Konfirmasi',
    save: 'Simpan',
    delete: 'Hapus',
    back: 'Kembali',
    next: 'Lanjut',
    close: 'Tutup',
    search: 'Cari',
    filter: 'Filter',
    empty: 'Tidak ada data',
  },
  auth: {
    login: 'Masuk',
    logout: 'Keluar',
    email: 'Email',
    phone: 'Nomor HP',
    identifier: 'Email / Nomor HP',
    password: 'Kata Sandi',
    forgotPassword: 'Lupa kata sandi?',
    changePassword: 'Ganti Kata Sandi',
    newPassword: 'Kata Sandi Baru',
    confirmPassword: 'Konfirmasi Kata Sandi Baru',
    temporaryPassword: 'Kata Sandi Sementara',
    createPassword: 'Buat Kata Sandi Baru',
    sendReset: 'Kirim Instruksi',
    selectContext: 'Pilih Akses',
    noContexts: 'Tidak ada akses yang tersedia untuk akun ini.',
    sessionExpired: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    invalidCredentials: 'Email/nomor HP atau kata sandi salah.',
    passwordMismatch: 'Kata sandi tidak cocok',
    passwordTooShort: 'Kata sandi minimal 8 karakter',
    resetSent: 'Instruksi reset kata sandi telah dikirim. Periksa email atau SMS Anda.',
    forcedChangeHint:
      'Akun Anda menggunakan kata sandi sementara. Buat kata sandi baru untuk melanjutkan.',
  },
  payment: {
    pending: 'Menunggu verifikasi',
    approved: 'Pembayaran terverifikasi',
    rejected: 'Pengajuan ditolak',
    submitted: 'Pengajuan dikirim',
    paid: 'Lunas',
    unpaid: 'Belum lunas',
  },
}

export default id
export type IdLocale = typeof id
