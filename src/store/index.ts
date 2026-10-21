import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/shared/infrastructure/baseApi";
import { CATALOG_FILTERS_KEY, catalogFiltersReducer } from "@/modules/catalog";

// Created per request/provider instance. Never export a module-level store:
// on the server that would share state between users.
export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [CATALOG_FILTERS_KEY]: catalogFiltersReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
