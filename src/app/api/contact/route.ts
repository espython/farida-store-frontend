import { z } from "zod";
import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { clientIp, fixedWindowLimiter } from "@/shared/infrastructure/rateLimit.server";
import { sendContactMessage, validateContactMessage } from "@/modules/content/index.server";
import { LOCALES } from "@/shared/kernel/Locale";

// 5 messages per visitor per 15 minutes (WordPress has its own hourly backstop).
const isLimited = fixedWindowLimiter({ windowMs: 15 * 60 * 1000, max: 5 });

// Loose here (sizes only); the domain rule decides what is valid.
const body = z.object({
  name: z.unknown().optional(),
  email: z.unknown().optional(),
  message: z.unknown().optional(),
  locale: z.enum(LOCALES).optional(),
});

// The contact form: saved in WordPress ("Contact messages").
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    if (isLimited(clientIp(req.headers))) throw new AppError("rate_limited", "Too many attempts, please try again later", 429);
    const input = await parseJson(req, body);
    const checked = validateContactMessage(input);
    // Field names and rule codes only: the input is never echoed.
    if (!checked.ok) throw new AppError("validation_error", "Check the form", 400, checked.errors);
    await sendContactMessage(checked.message, input.locale ?? null);
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  },
});
