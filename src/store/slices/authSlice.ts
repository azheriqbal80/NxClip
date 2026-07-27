import { createSlice, PayloadAction, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { UserProfile } from "../../types";
import { retryWithBackoff, dispatchErrorToast } from "../../lib/errorNotify";
import { setGlobalError } from "./uiSlice";
import { safeLocalStorage, safeSessionStorage } from "../../lib/safeStorage";
import { STORAGE_KEYS } from "../../constants";

export interface SerializedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthState {
  user: SerializedUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Pre-load persisted credentials for instantaneous UI feel
const getPersistedUser = (): SerializedUser | null => {
  try {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.PERSISTED_USER) || safeSessionStorage.getItem(STORAGE_KEYS.PERSISTED_USER);
    return saved ? JSON.parse(saved) : null;
  } catch (_) {
    return null;
  }
};

const persistedUser = getPersistedUser();

const initialState: AuthState = {
  user: persistedUser,
  profile: null,
  isAuthenticated: !!persistedUser,
  loading: !persistedUser, // immediately load if we don't have a cached session, otherwise wait for auth listener confirm
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<SerializedUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setAuthProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logoutUser: (state) => {
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setAuthUser,
  setAuthProfile,
  setAuthLoading,
  setAuthError,
  logoutUser,
} = authSlice.actions;

// Async Thunks for authentication with retries and error notifications
export const fetchUserProfileAsync = createAsyncThunk(
  "auth/fetchUserProfile",
  async (uid: string, { dispatch, rejectWithValue }) => {
    dispatch(setAuthLoading(true));
    try {
      const apiCall = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/users/profile/${uid}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      };

      // Wrap the api call with our backoff retry helper (3 retries)
      const data = await retryWithBackoff(apiCall, 3, 1000, 2, (err, attempt) => {
        console.warn(`Fetch user profile failed, retrying... Attempts remaining: ${attempt}. Error: ${err.message}`);
      });

      dispatch(setAuthProfile(data));
      dispatch(setAuthLoading(false));
      return data;
    } catch (error: any) {
      // Dispatch error notification using the sonner library
      const errPayload = dispatchErrorToast(error, "Authentication", "Fetch User Profile");
      dispatch(setAuthError(errPayload.message));
      dispatch(setAuthLoading(false));
      dispatch(setGlobalError({
        message: errPayload.message,
        code: errPayload.code,
        context: "auth/fetchUserProfile"
      }));
      return rejectWithValue(errPayload.message);
    }
  }
);

// Selectors
const selectAuthState = (state: any) => state.auth;

export const selectAuthUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);

export const selectAuthProfile = createSelector(
  [selectAuthState],
  (auth) => auth.profile
);

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => auth.isAuthenticated
);

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth.loading
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error
);

export default authSlice.reducer;

