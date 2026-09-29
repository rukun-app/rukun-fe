// Bahasa Indonesia — default locale
// ponytail: add English (en) when multi-language support is needed
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
    password: 'Kata Sandi',
    forgotPassword: 'Lupa kata sandi?',
    changePassword: 'Ganti Kata Sandi',
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
