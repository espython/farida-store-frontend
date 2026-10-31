import Cookies from "js-cookie";

// Reads the non-secret "logged_in" presence flag.
// The actual JWT lives in an HttpOnly server cookie and is never exposed to JS.
// Sign-in, registration and sign-out go through modules/customer (/api/auth/*).
export const isUserLoggedIn = () => {
  return Cookies.get("logged_in");
};
