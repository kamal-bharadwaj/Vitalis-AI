"use client";

import { useOnlineStatus, getLastSyncTime } from '@/lib/cache';
import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [lastSync, setLastSync] = useState('');

  useEffect(() => {
    if (!isOnline) {
      setLastSync(getLastSyncTime());
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-xs font-medium py-2 px-4 flex items-center justify-center gap-2 shadow-sm">
      <WifiOff size={14} />
      You&apos;re offline — showing cached data from {lastSync}. Some features may be unavailable.
    </div>
  );
}
