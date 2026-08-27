import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { useUserStore } from '@/store/useUserStore';

export function useTelegramAuth() {
  const { setUser, setAuthFailed } = useUserStore();

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (typeof window === 'undefined') return;

        // Coba inisialisasi Telegram WebApp jika tersedia
        try {
          WebApp.ready();
          WebApp.expand();
        } catch (e) {
          console.warn('Telegram WebApp SDK not fully initialized:', e);
        }

        let initData = WebApp.initData;

        // BYPASS / FALLBACK UNTUK DEBUGGING:
        // Jika initData kosong dan kita sedang di development atau ingin tes manual,
        // kita bisa kirim string kosong atau mock data agar API tetap merespons (atau sesuaikan kebutuhan backend).
        if (!initData) {
          console.warn('initData tidak ditemukan.');
          
          // Jika ingin bypass otomatis saat testing lokal, aktifkan baris di bawah ini:
          // if (process.env.NODE_ENV === 'development') {
          //   initData = 'query_id=AAH...&user=%7B%22id%22%3A123456789%7D...'; // mock initData jika perlu
          // } else {
          //   setAuthFailed();
          //   return;
          // }

          // Untuk sekarang kita biarkan trigger gagal jika benar-benar kosong:
          setAuthFailed();
          return;
        }

        const res = await fetch('/api/user/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });

        const data = await res.json();

        if (data.success) {
          setUser(data.user);
        } else {
          console.error('Auth API Error:', data.error);
          setAuthFailed();
        }
      } catch (error) {
        console.error('Gagal terhubung ke server auth:', error);
        setAuthFailed();
      }
    };

    authenticate();
  }, [setUser, setAuthFailed]);
}
