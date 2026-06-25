// Service Worker cache keys
const CACHE_NAME = 'vitalis-ai-v1';
const OFFLINE_DATA_KEYS = {
  healthMetrics: 'vitalis_health_metrics',
  chatHistory: 'vitalis_chat_history',
  patientProfile: 'vitalis_patient_profile',
  lastSyncTime: 'vitalis_last_sync',
};

// ------------------------------------------------------------------
// Generic cache read/write with timestamp
// ------------------------------------------------------------------
export function cacheData(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

export function getCachedData<T>(key: string, maxAgeMs = 24 * 60 * 60 * 1000): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > maxAgeMs) return null; // Expired
    return data as T;
  } catch {
    return null;
  }
}

export function clearCache(key: string): void {
  localStorage.removeItem(key);
}

// ------------------------------------------------------------------
// Domain-specific cache functions
// ------------------------------------------------------------------
export function cacheHealthMetrics(metrics: any) {
  cacheData(OFFLINE_DATA_KEYS.healthMetrics, metrics);
}

export function getCachedHealthMetrics() {
  return getCachedData(OFFLINE_DATA_KEYS.healthMetrics);
}

export function cacheChatHistory(uid: string, messages: any[]) {
  cacheData(`${OFFLINE_DATA_KEYS.chatHistory}_${uid}`, messages);
}

export function getCachedChatHistory(uid: string) {
  return getCachedData<any[]>(`${OFFLINE_DATA_KEYS.chatHistory}_${uid}`);
}

export function cachePatientProfile(uid: string, profile: any) {
  cacheData(`${OFFLINE_DATA_KEYS.patientProfile}_${uid}`, profile);
}

export function getCachedPatientProfile(uid: string) {
  return getCachedData(`${OFFLINE_DATA_KEYS.patientProfile}_${uid}`);
}

export function getLastSyncTime(): string {
  try {
    const raw = localStorage.getItem(OFFLINE_DATA_KEYS.lastSyncTime);
    if (!raw) return 'Never';
    const diff = Date.now() - parseInt(raw);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return 'Unknown';
  }
}

export function markSynced() {
  localStorage.setItem(OFFLINE_DATA_KEYS.lastSyncTime, Date.now().toString());
}

// ------------------------------------------------------------------
// Online/Offline detection hook (used by UI components)
// ------------------------------------------------------------------
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
