/**
 * Robust wrapper for localStorage and sessionStorage references
 * to safely handle cases where third-party localStorage or cookie blocking
 * throws standard DOMExceptions (e.g. inside sandboxed iframes).
 */

const inMemoryStorage: Record<string, string> = {};

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[Storage Bypassed] Failed to read key "${key}" from localStorage:`, e);
    }
    return inMemoryStorage[key] !== undefined ? inMemoryStorage[key] : null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
         window.localStorage.setItem(key, value);
         return;
      }
    } catch (e) {
      console.warn(`[Storage Bypassed] Failed to write key "${key}" to localStorage:`, e);
    }
    inMemoryStorage[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`[Storage Bypassed] Failed to delete key "${key}" from localStorage:`, e);
    }
    delete inMemoryStorage[key];
  },

  clear(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn("[Storage Bypassed] Failed to clear localStorage:", e);
    }
    Object.keys(inMemoryStorage).forEach((key) => {
      delete inMemoryStorage[key];
    });
  },

  keys(): string[] {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return Object.keys(window.localStorage);
      }
    } catch (e) {
      console.warn("[Storage Bypassed] Failed to get localStorage keys:", e);
    }
    return Object.keys(inMemoryStorage);
  }
};

const inMemorySessionStorage: Record<string, string> = {};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[Storage Bypassed] Failed to read key "${key}" from sessionStorage:`, e);
    }
    return inMemorySessionStorage[key] !== undefined ? inMemorySessionStorage[key] : null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
         window.sessionStorage.setItem(key, value);
         return;
      }
    } catch (e) {
      console.warn(`[Storage Bypassed] Failed to write key "${key}" to sessionStorage:`, e);
    }
    inMemorySessionStorage[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`[Storage Bypassed] Failed to delete key "${key}" from sessionStorage:`, e);
    }
    delete inMemorySessionStorage[key];
  },

  keys(): string[] {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        return Object.keys(window.sessionStorage);
      }
    } catch (e) {
      console.warn("[Storage Bypassed] Failed to get sessionStorage keys:", e);
    }
    return Object.keys(inMemorySessionStorage);
  }
};
