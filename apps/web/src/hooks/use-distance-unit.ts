"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { DistanceUnit } from "#/lib/format";

const STORAGE_KEY = "distance-unit";
const DEFAULT_UNIT: DistanceUnit = "mi";

const listeners = new Set<() => void>();

function getSnapshot(): DistanceUnit {
  if (typeof window === "undefined") return DEFAULT_UNIT;
  return (localStorage.getItem(STORAGE_KEY) as DistanceUnit) ?? DEFAULT_UNIT;
}

function getServerSnapshot(): DistanceUnit {
  return DEFAULT_UNIT;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useDistanceUnit() {
  const unit = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setUnit = useCallback((next: DistanceUnit) => {
    localStorage.setItem(STORAGE_KEY, next);
    for (const cb of listeners) cb();
  }, []);

  const toggle = useCallback(() => {
    setUnit(getSnapshot() === "mi" ? "km" : "mi");
  }, [setUnit]);

  return { unit, setUnit, toggle } as const;
}
