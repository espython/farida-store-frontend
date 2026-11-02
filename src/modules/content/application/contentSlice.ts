import { createSlice } from "@reduxjs/toolkit";

export const CONTENT_KEY = "content" as const;

/** UI state of the content: the shopper closed the announcement bar (for this visit). */
export interface ContentState {
  announcementDismissed: boolean;
}

export const initialContentState: ContentState = { announcementDismissed: false };

const slice = createSlice({
  name: "content",
  initialState: initialContentState,
  reducers: {
    announcementDismissed(state) {
      state.announcementDismissed = true;
    },
  },
});

export const contentActions = slice.actions;
export const contentReducer = slice.reducer;
export const selectAnnouncementDismissed = (s: { [CONTENT_KEY]: ContentState }) => s[CONTENT_KEY].announcementDismissed;
