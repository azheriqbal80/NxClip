import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { safeLocalStorage } from "../../lib/safeStorage";

export interface GlobalError {
  message: string;
  code?: string;
  timestamp: string;
  context?: string;
}

export interface UiState {
  globalError: GlobalError | null;
  sidebarOpen: boolean;
  errorHistory: GlobalError[];
  mockApiEnabled: boolean;
  apiEnv: "development" | "staging" | "production";
  authProvider: "mock" | "gateway";
  connectionStatus: Record<"development" | "staging" | "production", "idle" | "testing" | "connected" | "failed">;
  errorReasons: Record<"development" | "staging" | "production", { reason: string; details: string } | null>;
}

const initialState: UiState = {
  globalError: null,
  sidebarOpen: false,
  errorHistory: [],
  mockApiEnabled: safeLocalStorage.getItem("nxclip_mock_api") === "true",
  apiEnv: (safeLocalStorage.getItem("nxclip_api_env") as any) || "development",
  // Mock provider was removed; the app always authenticates against the live API gateway.
  authProvider: "gateway",
  connectionStatus: {
    development: "idle",
    staging: "idle",
    production: "idle",
  },
  errorReasons: {
    development: null,
    staging: null,
    production: null,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGlobalError: (
      state,
      action: PayloadAction<{ message: string; code?: string; context?: string } | null>
    ) => {
      if (action.payload) {
        const newError: GlobalError = {
          message: action.payload.message,
          code: action.payload.code,
          context: action.payload.context,
          timestamp: new Date().toISOString(),
        };
        state.globalError = newError;
        state.errorHistory.push(newError);
      } else {
        state.globalError = null;
      }
    },
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setMockApiEnabled: (state, action: PayloadAction<boolean>) => {
      state.mockApiEnabled = action.payload;
      safeLocalStorage.setItem("nxclip_mock_api", action.payload ? "true" : "false");
    },
    setApiEnv: (state, action: PayloadAction<"development" | "staging" | "production">) => {
      state.apiEnv = action.payload;
      safeLocalStorage.setItem("nxclip_api_env", action.payload);
    },
    setAuthProvider: (state, action: PayloadAction<"mock" | "gateway">) => {
      state.authProvider = action.payload;
      safeLocalStorage.setItem("nx_auth_provider", action.payload);
    },
    setConnectionStatus: (
      state,
      action: PayloadAction<{ env: "development" | "staging" | "production"; status: "idle" | "testing" | "connected" | "failed" }>
    ) => {
      if (!state.connectionStatus) {
        state.connectionStatus = {
          development: "idle",
          staging: "idle",
          production: "idle",
        };
      }
      state.connectionStatus[action.payload.env] = action.payload.status;
    },
    setConnectionError: (
      state,
      action: PayloadAction<{ env: "development" | "staging" | "production"; reason: string; details: string }>
    ) => {
      if (!state.errorReasons) {
        state.errorReasons = {
          development: null,
          staging: null,
          production: null,
        };
      }
      state.errorReasons[action.payload.env] = {
        reason: action.payload.reason,
        details: action.payload.details,
      };
    },
    clearConnectionError: (
      state,
      action: PayloadAction<"development" | "staging" | "production">
    ) => {
      if (!state.errorReasons) {
        state.errorReasons = {
          development: null,
          staging: null,
          production: null,
        };
      }
      state.errorReasons[action.payload] = null;
    },
  },
});

export const { setGlobalError, clearGlobalError, toggleSidebar, setSidebarOpen, setMockApiEnabled, setApiEnv, setAuthProvider, setConnectionStatus, setConnectionError, clearConnectionError } = uiSlice.actions;

// Memoized selectors
const selectUiState = (state: any) => state.ui;

export const selectGlobalError = createSelector(
  [selectUiState],
  (ui) => ui.globalError
);

export const selectSidebarOpen = createSelector(
  [selectUiState],
  (ui) => ui.sidebarOpen
);

export const selectErrorHistory = createSelector(
  [selectUiState],
  (ui) => ui.errorHistory
);

export const selectMockApiEnabled = createSelector(
  [selectUiState],
  (ui) => ui.mockApiEnabled
);

export const selectApiEnv = createSelector(
  [selectUiState],
  (ui) => ui.apiEnv
);

export const selectAuthProvider = createSelector(
  [selectUiState],
  (ui) => ui.authProvider || "gateway"
);

export const selectConnectionStatus = createSelector(
  [selectUiState],
  (ui) => ui.connectionStatus || { development: "idle", staging: "idle", production: "idle" }
);

export const selectErrorReasons = createSelector(
  [selectUiState],
  (ui) => ui.errorReasons || { development: null, staging: null, production: null }
);

export default uiSlice.reducer;
