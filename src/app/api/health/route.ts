import { NextResponse } from "next/server";

// Liveness for the container healthcheck and the reverse proxy: answers without calling WordPress,
// so a WordPress outage does not restart the storefront.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
