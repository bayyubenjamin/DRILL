import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { useUserStore } from '@/store/useUserStore';

export function useTelegramAuth() {
  const { setUser, setAuthFailed } = useUserStore();

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (typeof window === 'undefined') return;

        // Beritahu Telegram bahwa Mini App sudah siap ditampilkan
        WebApp.ready();
        
        // Expand Mini App ke ukuran penuh (UX lebih baik)
        WebApp.expand();

        const initData = WebApp.initData;

        if (!initData) {
          console.warn('initData tidak ditemukan. Apakah ini dijalankan di luar Telegram?');
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
