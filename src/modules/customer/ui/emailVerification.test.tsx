import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";
import { axeViolations } from "@/test/axe";

vi.mock("@/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const hooks = vi.hoisted(() => ({
  profile: { profile: null as unknown, retry: vi.fn() },
  verification: { resend: vi.fn(), resending: false, verify: vi.fn(), verifying: false },
}));
vi.mock("../application/useAccount", () => ({ useProfile: () => hooks.profile }));
vi.mock("../application/useEmailVerification", () => ({ useEmailVerification: () => hooks.verification }));

import EmailVerificationBanner from "./EmailVerificationBanner";
import VerifyEmailResult from "./VerifyEmailResult";

const wrap = (ui: React.ReactNode, locale: "en" | "ar" = "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      {ui}
    </NextIntlClientProvider>
  );
const profile = (emailVerified: boolean) => ({ firstName: "Nour", lastName: "Ali", email: "nour@example.com", emailVerified });
const link = { id: "7", token: "AbCdEfGhIjKlMnOpQrSt" };

beforeEach(() => {
  hooks.profile = { profile: null, retry: vi.fn() };
  hooks.verification = { resend: vi.fn(), resending: false, verify: vi.fn(), verifying: false };
});

describe("EmailVerificationBanner", () => {
  it("shows nothing for a confirmed email (or while the profile loads)", () => {
    expect(wrap(<EmailVerificationBanner />).container).toBeEmptyDOMElement();
    hooks.profile.profile = profile(true);
    expect(wrap(<EmailVerificationBanner />).container).toBeEmptyDOMElement();
  });

  it("reminds, names the address, and sends again", async () => {
    hooks.profile.profile = profile(false);
    hooks.verification.resend.mockResolvedValue({ ok: true, status: "sent" });
    const { container } = wrap(<EmailVerificationBanner />);
    expect(screen.getByRole("heading", { name: "Please confirm your email" })).toBeInTheDocument();
    expect(screen.getByText("nour@example.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Send the link again" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Sent. Check your inbox");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("reloads the profile when the email was confirmed meanwhile", async () => {
    hooks.profile.profile = profile(false);
    hooks.verification.resend.mockResolvedValue({ ok: true, status: "verified" });
    wrap(<EmailVerificationBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Send the link again" }));
    await waitFor(() => expect(hooks.profile.retry).toHaveBeenCalled());
  });
});

describe("VerifyEmailResult", () => {
  it("confirms once and says so, in Arabic too", async () => {
    hooks.verification.verify.mockResolvedValue({ ok: true });
    const { container } = wrap(<VerifyEmailResult link={link} />, "ar");
    expect(await screen.findByText("شكرًا، تم تأكيد بريدك الإلكتروني.")).toBeInTheDocument();
    expect(hooks.verification.verify).toHaveBeenCalledTimes(1);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("explains an expired link and points to the account", async () => {
    hooks.verification.verify.mockResolvedValue({ ok: false, failure: { code: "invalid_verify_link", fields: {} } });
    wrap(<VerifyEmailResult link={link} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid or has expired");
    expect(screen.getByRole("link", { name: "Go to your account" })).toHaveAttribute("href", "/user");
  });

  it("does not call the shop for a malformed link", () => {
    wrap(<VerifyEmailResult link={null} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(hooks.verification.verify).not.toHaveBeenCalled();
  });
});
