import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900 shadow-sm lg:bottom-5"
    >
      <WifiOff className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
      <span>Offline mode active — reading and writing directly to IndexedDB</span>
    </div>
  );
};
