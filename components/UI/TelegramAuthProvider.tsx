'use client';

import { ReactNode } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import TelegramGate from '@/components/UI/TelegramGate';

function AuthenticatedShell({ children }: { children: ReactNode }) {
  useTelegramAuth();

  // Render the shell immediately — do NOT block the whole app behind the
  // auth round trip. Pages already show their own skeletons while their
  // data loads, so the user sees the interface at once and the numbers
  // fill in as they arrive. Auth still runs in the background and the
  // user store updates when it finishes.
  return <>{children}</>;
}

export default function TelegramAuthProvider({ children }: { children: ReactNode }) {
  return (
    <TelegramGate>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </TelegramGate>
  );
}
