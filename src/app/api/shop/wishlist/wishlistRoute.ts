import { NextResponse } from "next/server";

/** The customer's own list: never cached anywhere. */
export const wishlistResponse = (body: unknown) => NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
