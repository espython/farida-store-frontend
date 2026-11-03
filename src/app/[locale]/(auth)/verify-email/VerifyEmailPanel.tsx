"use client";
import { useEffect, useMemo } from "react";
import { toVerifyLink, VerifyEmailResult } from "@/modules/customer";

/** Reads the link's parameters once and removes the token from the address bar and history. */
const VerifyEmailPanel = ({ id, token }: { id: string | null; token: string | null }) => {
  const link = useMemo(() => toVerifyLink(id, token), [id, token]);
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }, []);
  return <VerifyEmailResult link={link} />;
};

export default VerifyEmailPanel;
