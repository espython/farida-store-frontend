import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import type { Address } from "@/shared/kernel/Address";

vi.mock("@/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn() } }));
const hooks = vi.hoisted(() => ({ profile: {} as Record<string, unknown>, book: {} as Record<string, unknown> }));
vi.mock("../application/useAccount", () => ({ useProfile: () => hooks.profile, useAddressBook: () => hooks.book }));

import ProfileCard from "./ProfileCard";
import AddressBook from "./AddressBook";

const home: Address = { firstName: "Mona", lastName: "Ali", address1: "5 Tahrir St", address2: "", city: "Dokki", state: "EGGZ", postcode: "12611", phone: "01012345678" };
const work: Address = { ...home, address1: "9 Nile Corniche", city: "Maadi", state: "EGC", postcode: "11728" };
const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
const base = { signedOut: false, loading: false, failed: false, retry: vi.fn() };

beforeEach(() => {
  hooks.profile = { ...base, profile: { firstName: "Mona", lastName: "Ali", email: "m@x.io" }, saving: false, save: vi.fn().mockResolvedValue({ ok: true }) };
  hooks.book = {
    ...base,
    book: {
      addresses: [
        { id: "aaaaaa", address: home, isDefault: true },
        { id: "bbbbbb", address: work, isDefault: false },
      ],
      limit: 10,
    },
    busy: false,
    add: vi.fn().mockResolvedValue({ ok: true }),
    update: vi.fn().mockResolvedValue({ ok: true }),
    remove: vi.fn().mockResolvedValue({ ok: true }),
    setDefault: vi.fn().mockResolvedValue({ ok: true }),
  };
});

describe("ProfileCard", () => {
  it("shows the profile and saves an edited name", async () => {
    wrap(<ProfileCard />);
    expect(screen.getByRole("heading", { name: "Mona Ali" })).toBeInTheDocument();
    expect(screen.getByText("You sign in with this email.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit name" }));
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Mariam" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(hooks.profile.save).toHaveBeenCalledWith({ firstName: "Mariam", lastName: "Ali" }));
    await waitFor(() => expect(screen.queryByLabelText("First name")).not.toBeInTheDocument());
  });

  it("blocks an empty name and shows a server failure", async () => {
    hooks.profile.save = vi.fn().mockResolvedValue({ ok: false, failure: { code: "unavailable", fields: {} } });
    wrap(<ProfileCard />);
    fireEvent.click(screen.getByRole("button", { name: "Edit name" }));
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: " " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("This field is required")).toBeInTheDocument();
    expect(hooks.profile.save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Mona" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't save your profile");
  });

  it("asks a signed-out visitor to sign in", () => {
    hooks.profile = { ...hooks.profile, signedOut: true, profile: null };
    wrap(<ProfileCard />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });
});

describe("AddressBook", () => {
  it("lists the addresses with the default marked", () => {
    wrap(<AddressBook />);
    const [first, second] = screen.getAllByRole("article");
    expect(within(first).getByText("Default")).toBeInTheDocument();
    expect(first.querySelector("address")).toHaveTextContent("Dokki, Giza, 12611");
    expect(within(second).queryByText("Default")).not.toBeInTheDocument();
    expect(within(first).queryByRole("button", { name: "Make default" })).not.toBeInTheDocument();
    fireEvent.click(within(second).getByRole("button", { name: "Make default" }));
    expect(hooks.book.setDefault).toHaveBeenCalledWith("bbbbbb");
  });

  it("deletes only after a second click", async () => {
    wrap(<AddressBook />);
    const second = screen.getAllByRole("article")[1];
    fireEvent.click(within(second).getByRole("button", { name: "Delete" }));
    expect(hooks.book.remove).not.toHaveBeenCalled();
    expect(within(second).getByRole("status")).toHaveTextContent("Delete this address?");
    fireEvent.click(within(second).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(hooks.book.remove).toHaveBeenCalledWith("bbbbbb"));
  });

  it("adds an address, optionally as the default", async () => {
    wrap(<AddressBook />);
    fireEvent.click(screen.getByRole("button", { name: "Add an address" }));
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Omar" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Ali" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "01112345678" } });
    fireEvent.change(screen.getByLabelText("Governorate"), { target: { value: "EGALX" } });
    fireEvent.change(screen.getByLabelText("City or district"), { target: { value: "Smouha" } });
    fireEvent.change(screen.getByLabelText("Street and building"), { target: { value: "3 Fawzy Moaz" } });
    fireEvent.change(screen.getByLabelText(/Postal code/), { target: { value: "21615" } });
    fireEvent.click(screen.getByLabelText(/Use as my default address/));
    fireEvent.click(screen.getByRole("button", { name: "Save address" }));
    await waitFor(() =>
      expect(hooks.book.add).toHaveBeenCalledWith(
        { firstName: "Omar", lastName: "Ali", phone: "01112345678", state: "EGALX", city: "Smouha", address1: "3 Fawzy Moaz", address2: "", postcode: "21615" },
        true
      )
    );
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
  });

  it("edits an address and shows a book failure on the form", async () => {
    hooks.book.update = vi.fn().mockResolvedValue({ ok: false, failure: { code: "not_found", fields: {} } });
    wrap(<AddressBook />);
    fireEvent.click(within(screen.getAllByRole("article")[1]).getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Street and building")).toHaveValue("9 Nile Corniche");
    fireEvent.click(screen.getByRole("button", { name: "Save address" }));
    await waitFor(() => expect(hooks.book.update).toHaveBeenCalledWith("bbbbbb", work, false));
    expect(await screen.findByRole("alert")).toHaveTextContent("already removed");
  });

  it("makes the first address the default without asking", () => {
    hooks.book = { ...hooks.book, book: { addresses: [], limit: 10 } };
    wrap(<AddressBook />);
    fireEvent.click(screen.getByRole("button", { name: "Add an address" }));
    const box = screen.getByLabelText(/Use as my default address/);
    expect(box).toBeChecked();
    expect(box).toBeDisabled();
  });

  it("hides adding when the book is full", () => {
    (hooks.book.book as { limit: number }).limit = 2;
    wrap(<AddressBook />);
    expect(screen.queryByRole("button", { name: "Add an address" })).not.toBeInTheDocument();
    expect(screen.getByText(/the most you can keep/)).toBeInTheDocument();
  });
});
