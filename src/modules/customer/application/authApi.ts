"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Session } from "../domain/Session";
import type { RegistrationInput } from "../domain/credentials";
import type { ResetLink } from "../domain/passwordReset";
import type { VerificationSent, VerifyLink } from "../domain/emailVerification";

export const AUTH_API_KEY = "authApi" as const;

/**
 * The customer's own auth routes (/api/auth/*). A separate API slice on
 * purpose: the shop baseApi treats every 401 as "session expired, go to
 * sign-in", but here a 401 means "wrong password" or "not signed in".
 */
export const authApi = createApi({
  reducerPath: AUTH_API_KEY,
  baseQuery: fetchBaseQuery({ baseUrl: "/api/auth", credentials: "same-origin" }),
  tagTypes: ["Session"],
  endpoints: (build) => ({
    me: build.query<Session, void>({
      query: () => "me",
      transformResponse: (body: { session: Session }) => body.session,
      providesTags: ["Session"],
    }),
    signIn: build.mutation<Session, { email: string; password: string }>({
      query: (body) => ({ url: "login", method: "POST", body }),
      transformResponse: (body: { session: Session }) => body.session,
      invalidatesTags: ["Session"],
    }),
    register: build.mutation<Session, RegistrationInput & { locale: "en" | "ar" }>({
      query: (body) => ({ url: "register", method: "POST", body }),
      transformResponse: (body: { session: Session }) => body.session,
      invalidatesTags: ["Session"],
    }),
    requestPasswordReset: build.mutation<void, { email: string; locale: "en" | "ar" }>({
      query: (body) => ({ url: "password/forgot", method: "POST", body }),
    }),
    resetPassword: build.mutation<Session, ResetLink & { password: string }>({
      query: (body) => ({ url: "password/reset", method: "POST", body }),
      transformResponse: (body: { session: Session }) => body.session,
      invalidatesTags: ["Session"],
    }),
    resendVerification: build.mutation<VerificationSent, { locale: "en" | "ar" }>({
      query: (body) => ({ url: "email/resend", method: "POST", body }),
      transformResponse: (body: { status: VerificationSent }) => body.status,
    }),
    verifyEmail: build.mutation<void, VerifyLink>({
      query: (body) => ({ url: "email/verify", method: "POST", body }),
    }),
    signOut: build.mutation<void, void>({
      query: () => ({ url: "logout", method: "POST" }),
      invalidatesTags: ["Session"],
    }),
  }),
});
