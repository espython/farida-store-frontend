import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";
import { axeViolations } from "@/test/axe";

const search = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => search.params }));

const wrap = (ui: React.ReactNode, locale: "en" | "ar" = "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      {ui}
    </NextIntlClientProvider>
  );
// The enabled flag is read when the module loads, like Next inlines it at build time.
const load = async (clientId?: string) => {
  vi.resetModules();
  if (clientId) vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", clientId);
  else vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
  return (await import("./GoogleProvider")).default;
};

afterEach(() => {
  vi.unstubAllEnvs();
  search.params = new URLSearchParams();
});

describe("GoogleProvider", () => {
  it("renders nothing until Google sign-in is configured", async () => {
    const GoogleProvider = await load();
    expect(wrap(<GoogleProvider />).container).toBeEmptyDOMElement();
  });

  it("is a link to the BFF with the language and a safe next", async () => {
    search.params = new URLSearchParams({ next: "/ar/cart/shipping" });
    const GoogleProvider = await load("client-1");
    const { container } = wrap(<GoogleProvider />, "ar");
    const link = screen.getByRole("link", { name: /Google/ });
    expect(link).toHaveAttribute("href", "/api/auth/google/start?locale=ar&next=%2Far%2Fcart%2Fshipping");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("drops an unsafe next", async () => {
    search.params = new URLSearchParams({ next: "//evil.test" });
    const GoogleProvider = await load("client-1");
    wrap(<GoogleProvider format="small" />);
    expect(screen.getByRole("link", { name: "Continue with Google" })).toHaveAttribute("href", "/api/auth/google/start?locale=en");
  });
});

describe("GoogleSignInNotice", () => {
  it.each(["cancelled", "expired", "unverified_email", "staff", "conflict", "failed"])("explains %s", async (reason) => {
    search.params = new URLSearchParams({ google: reason });
    const Notice = (await import("./GoogleSignInNotice")).default;
    wrap(<Notice />);
    expect(screen.getByRole("alert")).toHaveTextContent((en.google.errors as Record<string, string>)[reason]);
  });

  it("ignores anything else", async () => {
    search.params = new URLSearchParams({ google: "<script>" });
    const Notice = (await import("./GoogleSignInNotice")).default;
    expect(wrap(<Notice />).container).toBeEmptyDOMElement();
  });
});
