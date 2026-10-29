"use client";

import { useSyncExternalStore } from "react";

/* ---------------------------------------------------------------------------
 * These are all external-system subscriptions (a media query, the clock,
 * sessionStorage), so they use useSyncExternalStore rather than
 * useEffect + setState — which keeps React from cascading renders and gives
 * each one an explicit server snapshot for SSR.
 * ------------------------------------------------------------------------- */

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia(MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Live reduced-motion state. The server snapshot is `true` so the very first
 * paint is always the still version — motion is opt-in, never a flash.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => true,
  );
}

/** True once mounted on the client; false during SSR and the first paint. */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * A value that ticks every `ms` on the client. Used by the countdown so the
 * clock is never read during render (which blocks prerendering).
 */
export function useNow(ms = 1000) {
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, ms);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / ms),
    () => 0,
  );
}

/** Reads one sessionStorage key reactively. Returns null during SSR. */
export function useSessionValue(key: string) {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener("ref2:session", onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("ref2:session", onChange);
      };
    },
    () => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null; // private mode
      }
    },
    () => null,
  );
}

/** Writes a sessionStorage key and notifies `useSessionValue` subscribers. */
export function writeSessionValue(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
    window.dispatchEvent(new Event("ref2:session"));
  } catch {
    /* private mode — the in-memory state still carries the session */
  }
}

/* --- localStorage, read reactively ---------------------------------------- */

const LOCAL_EVENT = "ref2:local";

export function useLocalValue(key: string) {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener(LOCAL_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(LOCAL_EVENT, onChange);
      };
    },
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null; // private mode
      }
    },
    () => null,
  );
}

export function writeLocalValue(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    window.dispatchEvent(new Event(LOCAL_EVENT));
  } catch {
    /* private mode — state still carries the session in memory */
  }
}

/* --- connectivity, read reactively ---------------------------------------- */

export function useOnline() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    () => true, // assume online during SSR
  );
}
