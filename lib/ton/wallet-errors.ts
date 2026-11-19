// Alasan wallet terputus / gagal terikat, dalam Bahasa Indonesia yang
// dimengerti pengguna. Satu akun Telegram = satu wallet, dan satu wallet =
// satu akun Telegram; aturan itu ditegakkan server di /api/user/wallet.

export type WalletFailureKind = 'taken' | 'locked' | 'invalid' | 'session' | 'not-found' | 'server' | 'network';

export interface WalletFailure {
  kind: WalletFailureKind;
  /** Judul singkat untuk toast. */
  title: string;
  /** Penjelasan + apa yang harus dilakukan pengguna. */
  message: string;
  /** true = pelanggaran aturan ikat yang sudah pasti; wallet harus diputus. */
  mustDisconnect: boolean;
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Terjemahkan respons gagal dari /api/user/wallet menjadi alasan yang jelas.
 * `code` adalah `code` dari server (WALLET_TAKEN / WALLET_LOCKED /
 * INVALID_WALLET) atau status HTTP-nya; `boundWallet` adalah alamat wallet
 * yang sudah terikat (bila server mengembalikannya).
 */
export function describeWalletFailure(
  opts: { code?: string | null; status?: number | null; boundWallet?: string | null },
): WalletFailure {
  const bound = opts.boundWallet ? shortAddress(opts.boundWallet) : null;
  switch (opts.code) {
    case 'WALLET_TAKEN':
      return {
        kind: 'taken',
        title: 'Wallet sudah dipakai akun lain',
        message:
          'Wallet ini sudah terikat ke akun Telegram lain. Satu wallet hanya untuk satu akun — hubungkan wallet lain.',
        mustDisconnect: true,
      };
    case 'WALLET_LOCKED':
      return {
        kind: 'locked',
        title: 'Akun ini sudah terikat wallet lain',
        message: bound
          ? `Akun Telegram kamu sudah terikat ke wallet ${bound}. Satu akun hanya satu wallet — hubungkan wallet ${bound} itu.`
          : 'Akun Telegram kamu sudah terikat ke wallet lain. Satu akun hanya satu wallet — hubungkan wallet yang sudah terikat itu.',
        mustDisconnect: true,
      };
    case 'INVALID_WALLET':
      return {
        kind: 'invalid',
        title: 'Alamat wallet tidak valid',
        message: 'Alamat wallet yang dikirim tidak dikenali. Coba hubungkan lagi dari aplikasi wallet kamu.',
        mustDisconnect: true,
      };
    default:
      break;
  }
  if (opts.status === 401) {
    return {
      kind: 'session',
      title: 'Sesi Telegram kedaluwarsa',
      message:
        'Tutup Mini App lalu buka lagi dari bot @drillengine_bot, kemudian hubungkan wallet. Wallet kamu tetap terhubung untuk saat ini.',
      mustDisconnect: false,
    };
  }
  if (opts.status === 404) {
    return {
      kind: 'not-found',
      title: 'Akun belum terdaftar',
      message:
        'Akun Telegram kamu belum terdaftar di Drill. Tutup lalu buka lagi Mini App dari bot, kemudian hubungkan wallet.',
      mustDisconnect: false,
    };
  }
  if (opts.status === 500 || opts.status === 502 || opts.status === 503) {
    return {
      kind: 'server',
      title: 'Server sedang bermasalah',
      message:
        'Wallet kamu tetap terhubung — yang gagal hanya pencatatan ke server. Coba lagi sebentar lagi.',
      mustDisconnect: false,
    };
  }
  return {
    kind: 'network',
    title: 'Tidak bisa menghubungi server',
    message: 'Periksa koneksi internet kamu lalu coba lagi. Wallet kamu tetap terhubung untuk saat ini.',
    mustDisconnect: false,
  };
}
