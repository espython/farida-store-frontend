"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { makeStore, type AppStore } from "./index";

// Redux store for server data (RTK Query) and client slices. It lives next to
// the MobX provider until the stores are migrated (see doc/ master plan).
const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    // Enables refetchOnFocus / refetchOnReconnect for queries that opt in.
    return setupListeners(storeRef.current!.dispatch);
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
};

export default StoreProvider;
