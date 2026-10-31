import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";
import { Money } from "@/shared/kernel/Money";
import type { Order, OrderStatus } from "../domain/Order";

const push = vi.hoisted(() => vi.fn());
vi.mock("@/navigation", () => ({
  useRouter: () => ({ push }),
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const hook = vi.hoisted(() => ({ order: {} as Record<string, unknown> }));
vi.mock("../application/useOrders", () => ({ useOrder: () => hook.order, useOrders: () => ({}) }));

import OrderTracking from "./OrderTracking";
import OrderLookup from "./OrderLookup";
import OrderOverview from "./OrderOverview";

const order = (over: Partial<Order> = {}): Order => ({
  id: "298",
  status: "placed",
  createdAt: "2026-10-31T17:30:42",
  itemCount: 2,
  total: Money.of(577400),
  payment: "cod",
  deliveredAt: null,
  lines: [{ productId: "240", title: "Retro Kettle", quantity: 2, total: Money.of(398000), image: null, slug: "retro-kettle" }],
  address: { firstName: "Mona", lastName: "Ali", address1: "5 Tahrir St", address2: "", city: "Dokki", state: "EGGZ", postcode: "12611", phone: "01012345678" },
  note: "",
  totals: { items: Money.of(398000), shipping: Money.of(5000), discount: Money.zero(), total: Money.of(403000) },
  ...over,
});
const ready = (o: Order) => ({ order: o, loading: false, notFound: false, failed: false, signedOut: false, retry: vi.fn() });
const wrap = (ui: React.ReactNode, locale: "en" | "ar" = "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      {ui}
    </NextIntlClientProvider>
  );
const stepStates = () => screen.getAllByRole("listitem").map((li) => li.getAttribute("aria-current") ?? li.textContent?.match(/Done|Next/)?.[0]);

beforeEach(() => push.mockReset());

describe("OrderTracking", () => {
  it.each<[OrderStatus, (string | undefined)[]]>([
    ["placed", ["step", "Next", "Next"]],
    ["out_for_delivery", ["Done", "step", "Next"]],
    ["delivered", ["Done", "Done", "Done"]],
  ])("shows the timeline for %s", (status, states) => {
    hook.order = ready(order({ status, deliveredAt: status === "delivered" ? "2026-11-02T12:00:00" : null }));
    wrap(<OrderTracking orderId="298" />);
    expect(stepStates()).toEqual(states);
  });

  it("shows the status instead of a timeline for a cancelled order", () => {
    hook.order = ready(order({ status: "cancelled" }));
    wrap(<OrderTracking orderId="298" />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("This order was cancelled.");
  });

  it("says not found for someone else's order", () => {
    hook.order = { order: null, loading: false, notFound: true, failed: false, signedOut: false, retry: vi.fn() };
    wrap(<OrderTracking orderId="1" />);
    expect(screen.getByText("We couldn't find this order")).toBeInTheDocument();
  });

  it("offers a retry when the shop is unreachable", () => {
    const retry = vi.fn();
    hook.order = { order: null, loading: false, notFound: false, failed: true, signedOut: false, retry };
    wrap(<OrderTracking orderId="298" />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalled();
  });
});

describe("OrderOverview", () => {
  it("links products, names the governorate and asks for cash while on its way", () => {
    wrap(<OrderOverview order={order({ status: "out_for_delivery" })} />);
    expect(screen.getByRole("link", { name: "Retro Kettle" })).toHaveAttribute("href", "/product/retro-kettle");
    expect(screen.getByText(/5 Tahrir St, Dokki — Giza/)).toBeInTheDocument();
    expect(screen.getByText("Please have the exact amount ready for the courier.")).toBeInTheDocument();
  });

  it("drops the cash note once delivered, and uses Arabic names in Arabic", () => {
    wrap(<OrderOverview order={order({ status: "delivered", deliveredAt: "2026-11-02T12:00:00" })} />, "ar");
    expect(screen.queryByText("يرجى تجهيز المبلغ المطلوب لمندوب التوصيل.")).toBeNull();
    expect(screen.getByText(/5 Tahrir St، Dokki — الجيزة/)).toBeInTheDocument();
  });
});

describe("OrderLookup", () => {
  it("goes to the tracking page for a typed number", () => {
    wrap(<OrderLookup />);
    fireEvent.change(screen.getByLabelText("Order number"), { target: { value: " #298 " } });
    fireEvent.click(screen.getByRole("button", { name: "Track order" }));
    expect(push).toHaveBeenCalledWith("/trackorder/298");
  });

  it("explains a number it cannot read", () => {
    wrap(<OrderLookup />);
    fireEvent.change(screen.getByLabelText("Order number"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Track order" }));
    expect(screen.getByText("Enter the order number, digits only.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
