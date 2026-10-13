import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";

// Created per request/provider instance. Never export a module-level store:
// on the server that would share state between users.
export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
