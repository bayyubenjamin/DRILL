import { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';

export function useTelegramAuth() {
  const { setUser, setAuthFailed } = useUserStore();

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (typeof window === 'undefined') return;

        // Fungsi helper untuk mengambil initData secara aman dari Telegram native object
        const getTelegramInitData = () => {
          // @ts-ignore
          return window.Telegram?.WebApp?.initData || '';
        };

        // Perpanjang retry mechanism menjadi 50 iterasi (total 5 detik)
        // karena injeksi script Telegram di HP kadang lambat
        let initData = getTelegramInitData();
        let retries = 0;
        while (!initData && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          initData = getTelegramInitData();
          retries++;
        }

        // Jika setelah 5 detik tetap kosong
        if (!initData) {
          alert('Gagal mendapatkan initData Telegram. Pastikan dibuka di dalam aplikasi Telegram.');
          setAuthFailed();
          return;
        }

        // Ekspansi layar WebApp
        // @ts-ignore
        window.Telegram?.WebApp?.ready();
        // @ts-ignore
        window.Telegram?.WebApp?.expand();

        const res = await fetch('/api/user/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setUser(data.user);
        } else {
          // Tampilkan alert agar error dari Supabase / HMAC Telegram terlihat di HP
          alert(`Auth Error: ${res.status} - ${data.error || 'Unknown error'}`);
          setAuthFailed();
        }
      } catch (error: any) {
        alert(`Network/Client Error: ${error.message}`);
        setAuthFailed();
      }
    };

    authenticate();
  }, [setUser, setAuthFailed]);
}
