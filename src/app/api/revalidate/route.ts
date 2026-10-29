import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOG_CACHE_TAG } from "@/modules/catalog/index.server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute } from "@/shared/infrastructure/bff";
import { isValidWooSignature, isWooPing } from "@/shared/infrastructure/wooWebhook.server";

// Product payloads are a few tens of KB; anything far bigger is not from Woo.
const MAX_BODY_BYTES = 1_000_000;

/**
 * WooCommerce webhook target (topics product.created/updated/deleted/restored).
 * A signed delivery drops the cached Woo catalog reads, so the next request
 * refetches instead of waiting out the 60 s fetch cache.
 */
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    const secret = process.env.WC_WEBHOOK_SECRET;
    if (!secret) throw new AppError("internal_error", "Webhook secret is not configured", 500);
    if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
      throw new AppError("payload_too_large", "Payload too large", 413);
    }

    const body = await req.text();
    const signature = req.headers.get("x-wc-webhook-signature");
    // Woo checks the URL answers 2xx when the webhook is saved; the ping is unsigned.
    if (!signature && isWooPing(body)) return NextResponse.json({ ok: true });
    if (!isValidWooSignature(body, signature, secret)) {
      throw new AppError("unauthorized", "Invalid webhook signature", 401);
    }

    revalidateTag(CATALOG_CACHE_TAG);
    console.info("[revalidate]", req.headers.get("x-wc-webhook-topic"), req.headers.get("x-wc-webhook-resource"));
    return NextResponse.json({ revalidated: true });
  },
});
