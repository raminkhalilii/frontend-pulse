'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import type { MonitorUpdatedPayload } from '@/types';

interface UsePulseSocketOptions {
  onMonitorUpdated: (payload: MonitorUpdatedPayload) => void;
  enabled?: boolean;
}

export function usePulseSocket({ onMonitorUpdated, enabled = true }: UsePulseSocketOptions) {
  // Store the callback in a ref so changing it never triggers a reconnect
  const callbackRef = useRef(onMonitorUpdated);
  callbackRef.current = onMonitorUpdated;

  useEffect(() => {
    if (!enabled) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error('NEXT_PUBLIC_API_URL is not set, socket connection skipped.');
      return;
    }

    const socket = io(apiUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('monitor.updated', (payload: MonitorUpdatedPayload) => {
      callbackRef.current(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled]); // only reconnect when `enabled` flips — not on every callback change
}
