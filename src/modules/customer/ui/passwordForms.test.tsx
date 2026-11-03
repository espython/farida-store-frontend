import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";

vi.mock("@/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const hook = vi.hoisted(() => ({ requestReset: vi.fn(), reset: vi.fn(), sending: false, resetting: false }));
vi.mock("../application/usePasswordReset", () => ({ usePasswordReset: () => hook }));

import ForgotPasswordForm from "./ForgotPasswordForm";
import ResetPasswordForm from "./ResetPasswordForm";
import { axeViolations } from "@/test/axe";

const wrap = (ui: React.ReactNode, locale: "en" | "ar" = "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      {ui}
    </NextIntlClientProvider>
  );
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const link = { key: "AbCdEfGhIjKlMnOpQrSt", login: "c_1a2b3c" };

beforeEach(() => {
  hook.requestReset.mockReset();
  hook.reset.mockReset();
});

describe("ForgotPasswordForm", () => {
  it("validates the email first", async () => {
    wrap(<ForgotPasswordForm />);
    type("Email", "nope");
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(hook.requestReset).not.toHaveBeenCalled();
  });

  it("confirms without saying whether the account exists", async () => {
    hook.requestReset.mockResolvedValue({ ok: true });
    wrap(<ForgotPasswordForm />);
    type("Email", "nour@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If there's an account for nour@example.com");
    expect(screen.getByText(/works for one hour/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to log in" })).toHaveAttribute("href", "/login");
  });

  it("explains a rate limit", async () => {
    hook.requestReset.mockResolvedValue({ ok: false, failure: { code: "rate_limited", fields: {} } });
    wrap(<ForgotPasswordForm />);
    type("Email", "nour@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
  });

  it("reads in Arabic", () => {
    wrap(<ForgotPasswordForm />, "ar");
    expect(screen.getByRole("button", { name: "إرسال رابط إعادة التعيين" })).toBeInTheDocument();
  });
});

describe("ResetPasswordForm", () => {
  it("offers a new link when the page has none", () => {
    wrap(<ResetPasswordForm link={null} onDone={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("invalid or has expired");
    expect(screen.getByRole("link", { name: "Get a new link" })).toHaveAttribute("href", "/forgot-password");
  });

  it("applies the password rule and checks the confirmation", async () => {
    wrap(<ResetPasswordForm link={link} onDone={vi.fn()} />);
    type("New password", "nouppercase1");
    type("Confirm new password", "different");
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    expect(await screen.findByText("Add an uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    expect(hook.reset).not.toHaveBeenCalled();
  });

  it("saves and reports the signed-in session", async () => {
    const session = { customerId: "7", email: "n@x.io", displayName: "Nour", expiresAt: 9e9 };
    hook.reset.mockResolvedValue({ ok: true, session });
    const onDone = vi.fn();
    wrap(<ResetPasswordForm link={link} onDone={onDone} />);
    type("New password", "NewPass1");
    type("Confirm new password", "NewPass1");
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(session));
    expect(hook.reset).toHaveBeenCalledWith(link, "NewPass1");
  });

  it("switches to 'get a new link' when the key was used or expired", async () => {
    hook.reset.mockResolvedValue({ ok: false, failure: { code: "invalid_reset_link", fields: {} } });
    wrap(<ResetPasswordForm link={link} onDone={vi.fn()} />);
    type("New password", "NewPass1");
    type("Confirm new password", "NewPass1");
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    expect(await screen.findByRole("link", { name: "Get a new link" })).toBeInTheDocument();
  });
});

describe("accessibility (axe, #195)", () => {
  it("forgot and reset forms, and the invalid-link state, in both languages", async () => {
    for (const locale of ["en", "ar"] as const) {
      const { container, unmount } = wrap(
        <>
          <ForgotPasswordForm />
          <ResetPasswordForm link={link} onDone={vi.fn()} />
          <ResetPasswordForm link={null} onDone={vi.fn()} />
        </>,
        locale
      );
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});
