import { useEffect, useRef, useState } from "react";
import { api, streamUrl, unwrap } from "../lib/api";
import type { QueueSnapshot, TicketPublic } from "../lib/api";

export type LastCall = {
  loket: number;
  ticket: TicketPublic;
  at: number;
  recalled: boolean;
};

type Callbacks = {
  onCalled?: (call: LastCall) => void;
};

/**
 * Snapshot awal via treaty GET /api/queue, lalu live update via SSE
 * GET /api/stream (EventSource auto-reconnect).
 */
export function useQueueStream(callbacks?: Callbacks) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastCall, setLastCall] = useState<LastCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    let cancelled = false;

    api()
      .api.queue.get()
      .then((res) => {
        if (cancelled) return;
        try {
          setSnapshot(unwrap<QueueSnapshot>(res, "date", "Gagal memuat antrian"));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Gagal memuat antrian");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Tidak bisa terhubung ke server");
      });

    const es = new EventSource(streamUrl());

    const onSnapshot = (e: Event) => {
      try {
        setSnapshot(JSON.parse((e as MessageEvent).data) as QueueSnapshot);
        setError(null);
      } catch {
        /* abaikan chunk rusak */
      }
    };

    const onCall = (recalled: boolean) => (e: Event) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as {
          loket: number;
          ticket: TicketPublic;
        };
        const call: LastCall = {
          loket: data.loket,
          ticket: data.ticket,
          at: Date.now(),
          recalled,
        };
        setLastCall(call);
        cbRef.current?.onCalled?.(call);
      } catch {
        /* abaikan */
      }
    };

    es.addEventListener("snapshot", onSnapshot);
    es.addEventListener("called", onCall(false));
    es.addEventListener("recalled", onCall(true));
    es.onopen = () => {
      if (!cancelled) {
        setConnected(true);
        setError(null);
      }
    };
    es.onerror = () => {
      if (!cancelled) setConnected(false);
    };

    return () => {
      cancelled = true;
      es.close();
    };
  }, []);

  return { snapshot, connected, lastCall, error };
}
