export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          start_param?: string;
          user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            is_premium?: boolean;
          };
        };
        ready?: () => void;
        expand?: () => void;
        disableVerticalSwipes?: () => void;
        openTelegramLink?: (url: string) => void;
        HapticFeedback?: {
          notificationOccurred?: (type: 'success' | 'warning' | 'error') => void;
          impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
        };
      };
    };
  }
}
