import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Creation } from "../../types";

export interface ContentState {
  items: Creation[];
  activeUploads: Record<string, { progress: number; status: string }>;
  loading: boolean;
  error: string | null;
}

const initialState: ContentState = {
  items: [],
  activeUploads: {},
  loading: false,
  error: null,
};

const contentSlice = createSlice({
  name: "content",
  initialState,
  reducers: {
    setCreations: (state, action: PayloadAction<Creation[]>) => {
      state.items = action.payload;
    },
    addCreation: (state, action: PayloadAction<Creation>) => {
      // Avoid duplicate keys
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
    },
    removeCreation: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateUploadProgress: (
      state,
      action: PayloadAction<{ id: string; progress: number; status: string }>
    ) => {
      state.activeUploads[action.payload.id] = {
        progress: action.payload.progress,
        status: action.payload.status,
      };
    },
    clearUploadProgress: (state, action: PayloadAction<string>) => {
      delete state.activeUploads[action.payload];
    },
    setContentLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setCreations,
  addCreation,
  removeCreation,
  updateUploadProgress,
  clearUploadProgress,
  setContentLoading,
} = contentSlice.actions;

export default contentSlice.reducer;
