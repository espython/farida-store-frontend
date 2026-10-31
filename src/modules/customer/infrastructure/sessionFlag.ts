import Cookies from "js-cookie";

/**
 * The readable `logged_in` flag set next to the httpOnly token. It only says
 * "a session cookie exists"; WordPress decides whether it is still valid
 * (/api/auth/me). Client-side only.
 */
export const hasSessionFlag = (): boolean => {
  try {
    return Cookies.get("logged_in") === "1";
  } catch {
    return false;
  }
};
