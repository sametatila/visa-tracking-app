'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type LiveReloadStatus = 'active' | 'paused';

const INTERVAL_MS = 15_000; // 15 saniye
const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 dakika
const THROTTLE_MS = 5_000; // 5 saniye activity throttle

interface UseLiveReloadOptions {
  onTick: () => void;
  enabled: boolean;
}

export function useLiveReload({ onTick, enabled }: UseLiveReloadOptions) {
  const [status, setStatus] = useState<LiveReloadStatus>('active');
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current < THROTTLE_MS) return;
    lastActivityRef.current = now;
    setStatus('active');
  }, []);

  // Activity event listeners
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'] as const;
    for (const event of events) {
      window.addEventListener(event, recordActivity, { passive: true });
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, recordActivity);
      }
    };
  }, [recordActivity]);

  // Idle detection
  useEffect(() => {
    const idleCheck = setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS) {
        setStatus('paused');
      }
    }, 10_000);
    return () => clearInterval(idleCheck);
  }, []);

  // Visibility API
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setStatus('paused');
      } else {
        if (Date.now() - lastActivityRef.current <= IDLE_TIMEOUT_MS) {
          setStatus('active');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Polling interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (status === 'active' && enabled) {
      intervalRef.current = setInterval(() => {
        onTickRef.current();
      }, INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, enabled]);

  return { status };
}
