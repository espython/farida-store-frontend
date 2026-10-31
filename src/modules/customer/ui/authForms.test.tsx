import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";

const actions = vi.hoisted(() => ({ signIn: vi.fn(), register: vi.fn(), signOut: vi.fn(), pending: false }));
vi.mock("../application/useAuthActions", () => ({ useAuthActions: () => actions }));

import SignInForm from "./SignInForm";
import RegisterForm from "./RegisterForm";

const session = { customerId: "7", email: "s@x.io", displayName: "Salma", expiresAt: 9e9 };
const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
const type = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  actions.signIn.mockReset();
  actions.register.mockReset();
});

describe("SignInForm", () => {
  it("validates before calling the use case", async () => {
    wrap(<SignInForm onSignedIn={vi.fn()} />);
    type("Email", "nope");
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(actions.signIn).not.toHaveBeenCalled();
  });

  it("signs in and reports the session", async () => {
    actions.signIn.mockResolvedValue({ ok: true, session });
    const onSignedIn = vi.fn();
    wrap(<SignInForm onSignedIn={onSignedIn} />);
    type("Email", "s@x.io");
    type("Password", "Secret1");
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(session));
    expect(actions.signIn).toHaveBeenCalledWith("s@x.io", "Secret1");
  });

  it("shows one message for a wrong email or password, another for an outage", async () => {
    actions.signIn.mockResolvedValueOnce({ ok: false, failure: { code: "invalid_credentials", fields: {} } });
    wrap(<SignInForm onSignedIn={vi.fn()} />);
    type("Email", "s@x.io");
    type("Password", "wrong");
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password");

    actions.signIn.mockResolvedValueOnce({ ok: false, failure: { code: "unavailable", fields: {} } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("couldn't reach the shop"));
  });
});

describe("RegisterForm", () => {
  const fill = () => {
    type("First Name", "Salma");
    type("Last Name", "Kamal");
    type("Email", "s@x.io");
    type(/^Password$/, "Abc123");
    type("Confirm Password", "Abc123");
  };

  it("applies the domain password rule and the confirmation check", async () => {
    wrap(<RegisterForm onRegistered={vi.fn()} />);
    fill();
    type(/^Password$/, "abc123");
    type("Confirm Password", "other");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Add an uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    expect(actions.register).not.toHaveBeenCalled();
  });

  it("registers with the trimmed input, without the confirmation field", async () => {
    actions.register.mockResolvedValue({ ok: true, session });
    const onRegistered = vi.fn();
    wrap(<RegisterForm onRegistered={onRegistered} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(onRegistered).toHaveBeenCalledWith(session));
    expect(actions.register).toHaveBeenCalledWith({
      firstName: "Salma",
      lastName: "Kamal",
      email: "s@x.io",
      password: "Abc123",
    });
  });

  it("puts a taken email and server field errors on their fields", async () => {
    actions.register.mockResolvedValueOnce({ ok: false, failure: { code: "email_taken", fields: {} } });
    wrap(<RegisterForm onRegistered={vi.fn()} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText(/An account with this email already exists/)).toBeInTheDocument();

    actions.register.mockResolvedValueOnce({
      ok: false,
      failure: { code: "invalid_input", fields: { lastName: "name_too_long" } },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Use 60 characters or fewer")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
