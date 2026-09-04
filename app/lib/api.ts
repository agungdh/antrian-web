import { treaty } from "@elysiajs/eden";
import type { App } from "../../../antrian-api/src/index";

export type {
  LoketSnapshot,
  QueueSnapshot,
  TicketPublic,
} from "../../../antrian-api/src/queue/service";

/** Base URL BE. Prod: same-origin (BE serve FE statis). Dev: vite proxy /api. */
export function apiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function api() {
  return treaty<App>(apiBaseUrl());
}

export type Api = ReturnType<typeof api>;

export function streamUrl(): string {
  return `${apiBaseUrl()}/api/stream`;
}

export type ApiErrorBody = { error: string; message: string };

/** Ambil pesan error dari response Eden ({ error, message } BE) secara toleran. */
export function toApiError(error: unknown, fallback: string): ApiErrorBody {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    const message =
      typeof e.message === "string" && e.message.length > 0
        ? e.message
        : typeof e.error === "string" && e.error.length > 0
          ? e.error
          : fallback;
    return {
      error: typeof e.error === "string" ? e.error : "ERROR",
      message,
    };
  }
  if (typeof error === "string" && error.length > 0)
    return { error, message: error };
  return { error: "ERROR", message: fallback };
}

/**
 * Ambil data sukses treaty, throw Error(message) kalau BE mengembalikan
 * body error ({ error, message }) atau HTTP error.
 * `successKey` = properti yang hanya ada di response sukses.
 */
export function unwrap<T>(
  result: { data: unknown; error: unknown },
  successKey: string,
  fallback: string
): T {
  const { data, error } = result;
  if (error) throw new Error(toApiError(error, fallback).message);
  if (
    !data ||
    typeof data !== "object" ||
    !(successKey in (data as Record<string, unknown>))
  ) {
    throw new Error(toApiError(data, fallback).message);
  }
  return data as T;
}
