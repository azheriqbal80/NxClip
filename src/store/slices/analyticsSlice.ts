import { createSlice, PayloadAction, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { AnalyticsReport } from "../../types";
import { retryWithBackoff, dispatchErrorToast } from "../../lib/errorNotify";
import { setGlobalError } from "./uiSlice";

export interface AnalyticsMetrics {
  views: number;
  likes: number;
  shares: number;
  completionRate: number;
  followers: number;
}

export interface AnalyticsState {
  metrics: AnalyticsMetrics;
  reports: AnalyticsReport[];
  latestReport: AnalyticsReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  metrics: {
    views: 0,
    likes: 0,
    shares: 0,
    completionRate: 0,
    followers: 0,
  },
  reports: [],
  latestReport: null,
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setMetrics: (state, action: PayloadAction<AnalyticsMetrics>) => {
      state.metrics = action.payload;
    },
    updateMetrics: (state, action: PayloadAction<Partial<AnalyticsMetrics>>) => {
      state.metrics = { ...state.metrics, ...action.payload };
    },
    setReports: (state, action: PayloadAction<AnalyticsReport[]>) => {
      state.reports = action.payload;
      if (action.payload.length > 0) {
        state.latestReport = action.payload[0];
      }
    },
    addReport: (state, action: PayloadAction<AnalyticsReport>) => {
      state.reports.unshift(action.payload);
      state.latestReport = action.payload;
    },
    setAnalyticsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAnalyticsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setMetrics,
  updateMetrics,
  setReports,
  addReport,
  setAnalyticsLoading,
  setAnalyticsError,
} = analyticsSlice.actions;

// Async Thunks with exponential backoff retries and error notifications
export const fetchMetricsAsync = createAsyncThunk(
  "analytics/fetchMetrics",
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(setAnalyticsLoading(true));
    try {
      const apiCall = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/analytics/metrics`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      };

      // Exponential backoff: starting 1000ms, up to 3 retries, factor 2
      const data = await retryWithBackoff(apiCall, 3, 1000, 2, (err, attempt) => {
        console.warn(`Fetch metrics failed, retrying... Attempts remaining: ${attempt}. Error: ${err.message}`);
      });

      dispatch(setMetrics(data));
      dispatch(setAnalyticsLoading(false));
      return data;
    } catch (error: any) {
      const errPayload = dispatchErrorToast(error, "Analytics", "Fetch Metrics");
      dispatch(setAnalyticsError(errPayload.message));
      dispatch(setAnalyticsLoading(false));
      dispatch(setGlobalError({
        message: errPayload.message,
        code: errPayload.code,
        context: "analytics/fetchMetrics"
      }));
      return rejectWithValue(errPayload.message);
    }
  }
);

export const fetchReportsAsync = createAsyncThunk(
  "analytics/fetchReports",
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(setAnalyticsLoading(true));
    try {
      const apiCall = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/analytics/report/latest`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      };

      // Exponential backoff: starting 1000ms, up to 3 retries, factor 2
      const data = await retryWithBackoff(apiCall, 3, 1000, 2, (err, attempt) => {
        console.warn(`Fetch reports failed, retrying... Attempts remaining: ${attempt}. Error: ${err.message}`);
      });

      dispatch(setReports(Array.isArray(data) ? data : [data]));
      dispatch(setAnalyticsLoading(false));
      return data;
    } catch (error: any) {
      const errPayload = dispatchErrorToast(error, "Analytics", "Fetch Reports");
      dispatch(setAnalyticsError(errPayload.message));
      dispatch(setAnalyticsLoading(false));
      dispatch(setGlobalError({
        message: errPayload.message,
        code: errPayload.code,
        context: "analytics/fetchReports"
      }));
      return rejectWithValue(errPayload.message);
    }
  }
);

// Memoized selectors
const selectAnalyticsState = (state: any) => state.analytics;

export const selectAnalyticsMetrics = createSelector(
  [selectAnalyticsState],
  (analytics) => analytics.metrics
);

export const selectAnalyticsReports = createSelector(
  [selectAnalyticsState],
  (analytics) => analytics.reports
);

export const selectLatestReport = createSelector(
  [selectAnalyticsState],
  (analytics) => analytics.latestReport
);

export const selectAnalyticsLoading = createSelector(
  [selectAnalyticsState],
  (analytics) => analytics.loading
);

export const selectAnalyticsError = createSelector(
  [selectAnalyticsState],
  (analytics) => analytics.error
);

export default analyticsSlice.reducer;
