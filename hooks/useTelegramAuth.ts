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

        // Berikan sedikit waktu (retry mechanism) jika Telegram WebApp object terlambat inject
        let initData = getTelegramInitData();
        let retries = 0;
        while (!initData && retries < 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          initData = getTelegramInitData();
          retries++;
        }

        // Jika setelah dicoba beberapa kali tetap kosong, baru anggap gagal/di luar telegram
        if (!initData) {
          console.warn('initData tetap kosong setelah dicoba ulang.');
          setAuthFailed();
          return;
        }

        // Opsional: panggil ready dan expand secara aman
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
