import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { login, setSessionCookies, validateLogin } from "@/modules/customer/index.server";
import { loginBody } from "../authSchemas";

// The token goes into the httpOnly cookie only; the body carries the session.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    const { email, password } = await parseJson(req, loginBody);
    const errors = validateLogin(email, password);
    if (Object.keys(errors).length) throw new AppError("invalid_input", "Invalid sign-in details", 400, errors);
    const { token, session } = await login(email, password);
    const res = NextResponse.json({ session });
    setSessionCookies(res, token, session);
    return res;
  },
});
