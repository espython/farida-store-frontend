import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";
import { Money } from "@/shared/kernel/Money";
import type { Order } from "../domain/Order";

vi.mock("react-toastify", () => ({ toast: { success: vi.fn() } }));
const actions = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));
vi.mock("../application/useOrderActions", () => ({ useOrderActions: () => actions.value }));

import OrderActions from "./OrderActions";

const order = (over: Partial<Order> = {}): Order => ({
  id: "298", status: "placed", createdAt: "2026-10-31T17:30:42", itemCount: 1, total: Money.of(100000), payment: "cod", deliveredAt: null,
  lines: [], address: { firstName: "Mona", lastName: "Ali", address1: "", address2: "", city: "", state: "", postcode: "", phone: "" }, note: "",
  totals: { items: Money.of(100000), shipping: Money.zero(), discount: Money.zero(), total: Money.of(100000) }, ...over,
});
const base = () => ({
  canCancel: false, cancel: vi.fn(async () => ({ ok: true })), cancelling: false,
  canRequestReturn: false, returnDeadline: null, requestReturn: vi.fn(async () => ({ ok: true })), requestingReturn: false,
});
const wrap = (o: Order, locale: "en" | "ar" = "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      <OrderActions order={o} />
    </NextIntlClientProvider>
  );

beforeEach(() => {
  actions.value = base();
});

describe("OrderActions", () => {
  it("shows nothing when the order can be neither cancelled nor returned", () => {
    const { container } = wrap(order({ status: "out_for_delivery" }));
    expect(container).toBeEmptyDOMElement();
  });

  it("asks before cancelling, and can keep the order", async () => {
    actions.value = { ...base(), canCancel: true };
    wrap(order());
    fireEvent.click(screen.getByRole("button", { name: "Cancel order" }));
    expect(screen.getByText("Cancel order #298? This can't be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, cancel the order" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Keep the order" }));
    expect(actions.value.cancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel order" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel the order" }));
    await waitFor(() => expect(actions.value.cancel).toHaveBeenCalledTimes(1));
  });

  it("explains when the shop already sent the order", async () => {
    actions.value = { ...base(), canCancel: true, cancel: vi.fn(async () => ({ ok: false, code: "not_cancellable" })) };
    wrap(order());
    fireEvent.click(screen.getByRole("button", { name: "Cancel order" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel the order" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("can no longer be cancelled");
  });

  it("offers a return until the deadline and shows field errors", async () => {
    actions.value = {
      ...base(),
      canRequestReturn: true,
      returnDeadline: new Date("2026-11-15T10:00:00Z"),
      requestReturn: vi.fn(async () => ({ ok: false, code: "invalid", errors: { reason: "reason_required" } })),
    };
    wrap(order({ status: "delivered", deliveredAt: "2026-11-01T10:00:00Z" }));
    expect(screen.getByText(/until Nov 15, 2026/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Request a return" }));
    expect(screen.getByRole("radio", { name: "It arrived damaged or doesn't work" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Send return request" }));
    expect(await screen.findByText("Choose a reason.")).toBeInTheDocument();
  });

  it("sends the chosen reason and details", async () => {
    actions.value = { ...base(), canRequestReturn: true, returnDeadline: new Date("2026-11-15T10:00:00Z") };
    wrap(order({ status: "delivered" }));
    fireEvent.click(screen.getByRole("button", { name: "Request a return" }));
    fireEvent.click(screen.getByRole("radio", { name: "Another reason" }));
    expect(screen.getByLabelText("Details")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "The lid does not fit" } });
    fireEvent.click(screen.getByRole("button", { name: "Send return request" }));
    await waitFor(() => expect(actions.value.requestReturn).toHaveBeenCalledWith({ reason: "other", details: "The lid does not fit" }));
    expect(screen.queryByRole("button", { name: "Send return request" })).not.toBeInTheDocument();
  });

  it("tells the customer a return was requested, in Arabic too", () => {
    wrap(order({ status: "return_requested" }), "ar");
    expect(screen.getByRole("heading", { name: "تم طلب الإرجاع" })).toBeInTheDocument();
  });
});
