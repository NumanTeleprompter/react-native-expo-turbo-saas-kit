import { useSyncExternalStore } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A tiny device-local store: one JSON value kept in AsyncStorage, readable
 * from any component with `use()`, writable with `update()`.
 */
export function createPersistedStore<T>(key: string, initial: T) {
  let snapshot = { value: initial, loaded: false };
  const listeners = new Set<() => void>();

  const set = (value: T, loaded: boolean) => {
    snapshot = { value, loaded };
    listeners.forEach((listener) => listener());
  };

  let loadFailed = false;

  const ready = AsyncStorage.getItem(key)
    .then((raw) => set(raw === null ? initial : (JSON.parse(raw) as T), true))
    .catch((error) => {
      console.error(`Failed to load "${key}"`, error);
      loadFailed = true;
      set(initial, true);
    });

  return {
    use: () =>
      useSyncExternalStore(
        (listener) => {
          listeners.add(listener);

          return () => void listeners.delete(listener);
        },
        () => snapshot,
      ),

    // Waits for the initial load so an early write can't clobber stored data,
    // and refuses to write if that load failed.
    update: async (fn: (current: T) => T) => {
      await ready;

      if (loadFailed) {
        throw new Error(`"${key}" could not be read; not overwriting it`);
      }

      const value = fn(snapshot.value);

      set(value, true);
      await AsyncStorage.setItem(key, JSON.stringify(value));
    },
  };
}
