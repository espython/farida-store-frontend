"use client";
import { useEffect, useState } from "react";
import { hasSessionFlag } from "../infrastructure/sessionFlag";
import type { Session } from "../domain/Session";
import { authApi } from "./authApi";

export type SessionStatus = "loading" | "signedIn" | "signedOut";

/**
 * Who is signed in. Asks WordPress (through /api/auth/me) only when the
 * session flag cookie exists, so signed-out visitors cost no round trip.
 * Starts as "loading" on every render path until mounted, so server and
 * client markup match.
 */
export const useSession = (): { session: Session | null; status: SessionStatus } => {
  const [flag, setFlag] = useState<boolean | null>(null);
  useEffect(() => setFlag(hasSessionFlag()), []);

  const { data, isLoading, isFetching, isError } = authApi.useMeQuery(undefined, { skip: !flag });

  if (flag === null) return { session: null, status: "loading" };
  if (!flag) return { session: null, status: "signedOut" };
  if (isLoading || (isFetching && !data)) return { session: null, status: "loading" };
  if (isError || !data) return { session: null, status: "signedOut" };
  return { session: data, status: "signedIn" };
};
