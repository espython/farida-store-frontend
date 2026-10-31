"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Session } from "../domain/Session";
import type { RegistrationInput } from "../domain/credentials";

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
    register: build.mutation<Session, RegistrationInput>({
      query: (body) => ({ url: "register", method: "POST", body }),
      transformResponse: (body: { session: Session }) => body.session,
      invalidatesTags: ["Session"],
    }),
    signOut: build.mutation<void, void>({
      query: () => ({ url: "logout", method: "POST" }),
      invalidatesTags: ["Session"],
    }),
  }),
});
