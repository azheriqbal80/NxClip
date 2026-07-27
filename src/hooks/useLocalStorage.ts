import { useState, useEffect, useCallback } from "react";
import { safeLocalStorage } from "../lib/safeStorage";

/**
 * A custom hook that manages states in localStorage and keeps them in sync
 * across page reloads and tab events, handling sandboxed iframe restrictions.
 */
export function useLocalStorage<T extends string>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const readValue = useCallback((): T => {
    try {
      const item = safeLocalStorage.getItem(key);
      return item !== null ? (item as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      safeLocalStorage.setItem(key, valueToStore);
      // Dispatch storage event to notify other hook instances and components
      if (typeof window !== "undefined") {
        try {
          window.dispatchEvent(new Event("storage"));
        } catch {
          try {
            const event = document.createEvent("Event");
            event.initEvent("storage", true, true);
            window.dispatchEvent(event);
          } catch (e) {
            // Ignore if both event dispatchers are blocked in sandboxed iframe
          }
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [readValue]);

  return [storedValue, setValue];
}
