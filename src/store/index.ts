import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { baseApi } from "@/shared/infrastructure/baseApi";
import { CATALOG_FILTERS_KEY, catalogFiltersReducer } from "@/modules/catalog";
import { CART_KEY, cartReducer, startCartPersistence } from "@/modules/cart";
import { AUTH_API_KEY, authApi } from "@/modules/customer";

// Created per request/provider instance. Never export a module-level store:
// on the server that would share state between users. The listener middleware
// is per store for the same reason.
export const makeStore = () => {
  const listener = createListenerMiddleware();
  startCartPersistence(listener);

  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [CATALOG_FILTERS_KEY]: catalogFiltersReducer,
      [CART_KEY]: cartReducer,
      [AUTH_API_KEY]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listener.middleware).concat(baseApi.middleware, authApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
