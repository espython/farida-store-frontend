"use client";
import React from "react";
import WishlistContent from "./WishlistContent";
import { useAuth } from "@/hooks/useAuth";
import LoginWarning from "./LoginWarning";
import PageSkeleton from "@/components/feedback/PageSkeleton";

const WishListSections = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <PageSkeleton variant="grid" />;

  return isLoggedIn ? <WishlistContent /> : <LoginWarning />;
};

export default WishListSections;
