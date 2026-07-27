import { configureStore, Middleware } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import contentReducer from "./slices/contentSlice";
import analyticsReducer from "./slices/analyticsSlice";
import uiReducer from "./slices/uiSlice";
import { safeLocalStorage, safeSessionStorage } from "../lib/safeStorage";
import { STORAGE_KEYS } from "../constants";

// Custom middleware to automatically synchronize the auth state to local storage or session storage
const authPersistenceMiddleware: Middleware = (_storeApi) => (next) => (action: any) => {
  const result = next(action);
  
  if (action.type === "auth/setAuthUser") {
    const user = action.payload;
    if (user) {
      const isRemembered = safeLocalStorage.getItem("nx_remember_me") === "true";
      const storage = isRemembered ? safeLocalStorage : safeSessionStorage;
      
      let existingUser = {};
      try {
        const saved = storage.getItem(STORAGE_KEYS.PERSISTED_USER);
        if (saved) {
          existingUser = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Error reading existing user for merge:", e);
      }
      
      const mergedUser = { ...existingUser, ...user };
      
      if (isRemembered) {
        safeLocalStorage.setItem(STORAGE_KEYS.PERSISTED_USER, JSON.stringify(mergedUser));
        safeLocalStorage.setItem(STORAGE_KEYS.LOGGED_IN, "true");
        // Clear session storage version
        safeSessionStorage.removeItem(STORAGE_KEYS.PERSISTED_USER);
        safeSessionStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
      } else {
        safeSessionStorage.setItem(STORAGE_KEYS.PERSISTED_USER, JSON.stringify(mergedUser));
        safeSessionStorage.setItem(STORAGE_KEYS.LOGGED_IN, "true");
        // Clear local storage version
        safeLocalStorage.removeItem(STORAGE_KEYS.PERSISTED_USER);
        safeLocalStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
      }

      // Notify any token listeners of state update
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("nx_auth_state_changed"));
      }
    } else {
      safeLocalStorage.removeItem(STORAGE_KEYS.PERSISTED_USER);
      safeLocalStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
      safeSessionStorage.removeItem(STORAGE_KEYS.PERSISTED_USER);
      safeSessionStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("nx_auth_state_changed"));
      }
    }
  } else if (action.type === "auth/logoutUser") {
    safeLocalStorage.removeItem(STORAGE_KEYS.PERSISTED_USER);
    safeLocalStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
    safeLocalStorage.removeItem("nx_remember_me");
    safeSessionStorage.removeItem(STORAGE_KEYS.PERSISTED_USER);
    safeSessionStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("nx_auth_state_changed"));
    }
  }
  
  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    content: contentReducer,
    analytics: analyticsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific actions or state paths if non-serializable objects get through
        ignoredActions: [
          "auth/setAuthUser", 
          "auth/setAuthProfile",
          "analytics/addReport",
          "analytics/setReports"
        ],
        ignoredPaths: [
          "auth.user", 
          "auth.profile",
          "analytics.latestReport",
          "analytics.reports"
        ],
      },
    }).concat(authPersistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

