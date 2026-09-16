"use client";

import { useSyncExternalStore } from "react";

/**
 * True after the component mounts in the browser.
 * Subscribe schedules a microtask so client snapshots re-render after hydration.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      queueMicrotask(onStoreChange);
      return () => {};
    },
    () => true,
    () => false,
  );
}
