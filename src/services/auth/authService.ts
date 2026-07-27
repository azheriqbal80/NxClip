import { safeLocalStorage, safeSessionStorage } from "../../lib/safeStorage";
import { STORAGE_KEYS } from "../../constants";
import { useState, useEffect } from "react";

/**
 * Gets the current persisted user from local or session storage.
 */
export function getPersistedUser(): any | null {
  try {
    const persisted = safeLocalStorage.getItem(STORAGE_KEYS.PERSISTED_USER) || 
                      safeSessionStorage.getItem(STORAGE_KEYS.PERSISTED_USER);
    if (persisted) {
      return JSON.parse(persisted);
    }
  } catch (e) {
    console.error("Error reading persisted user:", e);
  }
  return null;
}

/**
 * Saves the authenticated user to the appropriate storage.
 */
export function setPersistedUser(user: any, rememberMe: boolean = true): void {
  const storage = rememberMe ? safeLocalStorage : safeSessionStorage;
  const loggedInValue = "true";
  
  storage.setItem(STORAGE_KEYS.PERSISTED_USER, JSON.stringify(user));
  storage.setItem(STORAGE_KEYS.LOGGED_IN, loggedInValue);
  triggerTokenStateUpdate();
}

/**
 * Clears all local and session-stored authentication data.
 */
export function clearPersistedUser(): void {
  safeLocalStorage.removeItem(STORAGE_KEYS.PERSISTED_USER);
  safeLocalStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
  safeLocalStorage.removeItem("nx_access_token");
  safeLocalStorage.removeItem("auth_token");
  safeLocalStorage.removeItem("token");

  safeSessionStorage.removeItem(STORAGE_KEYS.PERSISTED_USER);
  safeSessionStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
  safeSessionStorage.removeItem("nx_access_token");
  safeSessionStorage.removeItem("auth_token");
  safeSessionStorage.removeItem("token");

  triggerTokenStateUpdate();
}

/**
 * Retrieves the active access token from storage.
 */
export function getAccessToken(): string {
  const user = getPersistedUser();
  if (user?.accessToken) return user.accessToken;
  if (user?.token) return user.token;
  if (user?.jwtToken) return user.jwtToken;
  if (user?.idToken) return user.idToken;
  const localToken = safeLocalStorage.getItem("nx_access_token") || 
                     safeLocalStorage.getItem("auth_token") || 
                     safeLocalStorage.getItem("token");
  if (localToken) return localToken;
  return "";
}

/**
 * Retrieves the active refresh token from storage.
 */
export function getRefreshToken(): string {
  const user = getPersistedUser();
  return user?.refreshToken || "";
}

/**
 * Updates the access token and optionally the refresh token in active storage.
 */
export function updateAccessToken(accessToken: string, refreshToken?: string): boolean {
  try {
    let isRemembered = false;
    let savedUser = safeLocalStorage.getItem(STORAGE_KEYS.PERSISTED_USER);
    
    if (savedUser) {
      isRemembered = true;
    } else {
      savedUser = safeSessionStorage.getItem(STORAGE_KEYS.PERSISTED_USER);
    }

    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      parsed.accessToken = accessToken;
      if (refreshToken) {
        parsed.refreshToken = refreshToken;
      }
      const storage = isRemembered ? safeLocalStorage : safeSessionStorage;
      storage.setItem(STORAGE_KEYS.PERSISTED_USER, JSON.stringify(parsed));
      triggerTokenStateUpdate();
      return true;
    }
  } catch (e) {
    console.error("Error updating tokens in storage:", e);
  }
  return false;
}

/**
 * A custom React Hook to safely access the current authentication token 
 * and react to authentication state updates.
 */
export function useAuthToken() {
  const [token, setToken] = useState<string>(getAccessToken());

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(getAccessToken());
    };

    // Listen for local/session storage updates or manual triggers
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("nx_auth_state_changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("nx_auth_state_changed", handleStorageChange);
    };
  }, []);

  return token;
}

/**
 * Dispatcher to trigger state synchronization across components/hooks when tokens change
 */
export function triggerTokenStateUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("nx_auth_state_changed"));
  }
}

/**
 * Checks if the user is currently persisted as logged in
 */
export function isLoggedInPersisted(): boolean {
  return safeLocalStorage.getItem(STORAGE_KEYS.LOGGED_IN) === "true" || 
         safeSessionStorage.getItem(STORAGE_KEYS.LOGGED_IN) === "true";
}
