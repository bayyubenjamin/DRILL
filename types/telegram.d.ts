export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
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
