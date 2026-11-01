import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import { Money } from "@/shared/kernel/Money";
import { emptyAddress, type Address } from "@/shared/kernel/Address";
import type { Checkout } from "../domain/Checkout";

const push = vi.hoisted(() => vi.fn());
vi.mock("@/navigation", () => ({
  useRouter: () => ({ push }),
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const hook = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("../application/useCheckout", () => ({ useCheckout: () => hook.value }));

import AddressForm from "@/shared/ui/AddressForm";
import PaymentStep from "./PaymentStep";

const address: Address = { firstName: "Mona", lastName: "Ali", address1: "12 El Nasr St", address2: "", city: "Nasr City", state: "EGC", postcode: "11765", phone: "01001234567" };
const checkout: Checkout = {
  lines: [{ product: { id: "1", slug: "k", title: "Kettle", image: null, unitPrice: Money.of(50000), regularUnitPrice: null, maxQuantity: null }, quantity: 2 }],
  address,
  shippingRates: [{ id: "flat_rate:1", name: "Flat rate", price: Money.of(5000), selected: true }],
  coupons: [],
  paymentMethods: ["cod"],
  totals: { items: Money.of(100000), shipping: Money.of(5000), discount: Money.zero(), total: Money.of(105000) },
};
const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );

beforeEach(() => {
  push.mockReset();
  hook.value = {
    checkout,
    loading: false,
    signedIn: true,
    loadFailed: false,
    busy: false,
    placing: false,
    chooseRate: vi.fn(),
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
    placeOrder: vi.fn().mockResolvedValue({ ok: true, orderId: "300" }),
  };
});

describe("AddressForm", () => {
  it("shows the domain errors and does not submit", async () => {
    const onSubmit = vi.fn();
    wrap(<AddressForm initial={emptyAddress()} busy={false} submitLabel="Continue" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "0223456789" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/Enter an Egyptian mobile number/)).toBeInTheDocument();
    expect(screen.getByText("Choose a governorate", { selector: "p" })).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid address and puts server field errors on their fields", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: false, fields: { city: "too_long" } });
    wrap(<AddressForm initial={address} busy={false} submitLabel="Continue" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(address));
    expect(await screen.findByText("Use 100 characters or fewer")).toBeInTheDocument();
  });
});

describe("PaymentStep", () => {
  it("defaults to cash on delivery, places the order and goes to the confirmation", async () => {
    wrap(<PaymentStep />);
    expect(screen.getByRole("radio", { name: /Cash on delivery/ })).toBeChecked();
    fireEvent.change(screen.getByLabelText("Order note"), { target: { value: " Call first " } });
    fireEvent.click(screen.getByRole("button", { name: /Place order · 1,050 EGP/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/cart/confirmation?order=300"));
    expect(hook.value.placeOrder).toHaveBeenCalledWith("cod", "Call first");
  });

  it("shows a stock error with a way back to the cart", async () => {
    hook.value.placeOrder = vi.fn().mockResolvedValue({ ok: false, failure: { code: "out_of_stock", fields: {} } });
    wrap(<PaymentStep />);
    fireEvent.click(screen.getByRole("button", { name: /Place order/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no longer in stock");
    expect(screen.getByRole("link", { name: "Review your cart" })).toHaveAttribute("href", "/cart");
  });

  it("asks for an address first when the saved one is incomplete", () => {
    hook.value.checkout = { ...checkout, address: { ...address, phone: "" } };
    wrap(<PaymentStep />);
    expect(screen.getByRole("link", { name: "Complete address" })).toHaveAttribute("href", "/cart/shipping");
    expect(screen.queryByRole("button", { name: /Place order/ })).toBeNull();
  });
});
