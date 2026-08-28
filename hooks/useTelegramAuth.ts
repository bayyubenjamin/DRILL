import { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';

export function useTelegramAuth() {
  const { setUser, setAuthFailed, setGuest } = useUserStore();

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (typeof window === 'undefined') return;

        const readInitData = () => window.Telegram?.WebApp?.initData || '';

        let initData = readInitData();
        let retries = 0;
        while (!initData && retries < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          initData = readInitData();
          retries += 1;
        }

        window.Telegram?.WebApp?.ready?.();
        window.Telegram?.WebApp?.expand?.();

        if (!initData) {
          setGuest();
          return;
        }

        const res = await fetch('/api/user/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });
        const data = await res.json();

        if (res.ok && data.success && data.user) {
          setUser(data.user);
          return;
        }

        console.error('Telegram auth failed:', data.error || res.status);
        setAuthFailed();
      } catch (error) {
        console.error('Telegram auth error:', error);
        setAuthFailed();
      }
    };

    void authenticate();
  }, [setUser, setAuthFailed, setGuest]);
}
