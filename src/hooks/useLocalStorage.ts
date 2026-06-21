import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * Custom hook for persisting state in localStorage.
 *
 * Features:
 * - Hydrates state from localStorage on mount.
 * - Syncs state changes back to localStorage via useEffect.
 * - Safe JSON parsing with try/catch (no crashes on corrupted data).
 * - Optional validator function for schema enforcement.
 * - Falls back to initial value if data is missing or corrupted.
 * - No infinite loops — useEffect depends only on [key, value].
 *
 * @param key       - localStorage key
 * @param fallback  - default value when key doesn't exist or data is corrupted
 * @param validator - optional function to validate/transform parsed data
 */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
  validator?: (data: unknown) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return fallback;
      const parsed = JSON.parse(stored);
      // If a validator is provided, run the parsed data through it
      return validator ? validator(parsed) : (parsed as T);
    } catch (error) {
      console.warn(`[useLocalStorage] Failed to hydrate "${key}":`, error);
      return fallback;
    }
  });

  // Persist to localStorage whenever the value changes.
  // key is stable across renders so this won't cause infinite loops.
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[useLocalStorage] Failed to persist "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
