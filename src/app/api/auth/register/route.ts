import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { register, setSessionCookies, validateRegistration } from "@/modules/customer/index.server";
import { registerBody } from "../authSchemas";

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    const input = await parseJson(req, registerBody);
    const errors = validateRegistration(input);
    if (Object.keys(errors).length) throw new AppError("invalid_input", "Invalid registration details", 400, errors);
    const { token, session } = await register(input);
    const res = NextResponse.json({ session }, { status: 201 });
    setSessionCookies(res, token, session);
    return res;
  },
});
