// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelOrder, requestReturn } from "./infrastructure/ordersClient.server";
import { returnNote } from "./infrastructure/orderNotes";
import { toOrder } from "./infrastructure/orderMapper";
import type { WcOrder } from "./infrastructure/wcOrderDto";

const address = { first_name: "Mona", last_name: "Ali", address_1: "5 Tahrir St", address_2: "", city: "Dokki", state: "EGGZ", postcode: "12611", phone: "01012345678" };
const wc = (over: Partial<WcOrder> = {}): WcOrder => ({
  id: 300, status: "processing", customer_id: 7, currency: "EGP", date_created: "2026-10-31T10:00:00", date_completed: null,
  payment_method: "cod", customer_note: "", total: "100.00", shipping_total: "0", discount_total: "0", shipping: address, billing: address,
  line_items: [], ...over,
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("order changes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let current: WcOrder;
  const writes = () =>
    fetchMock.mock.calls
      .filter(([, init]) => init?.method && init.method !== "GET")
      .map(([url, init]) => ({ method: init.method, path: new URL(String(url)).pathname, body: JSON.parse(init.body) }));

  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    process.env.WC_CONSUMER_KEY = "ck";
    process.env.WC_CONSUMER_SECRET = "cs";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    current = wc();
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      if (path.endsWith("/notes")) return json({ id: 1 }, 201);
      if (path.includes("/wc/store/v1/products")) return json([]);
      if (init?.method === "PUT") {
        current = { ...current, status: JSON.parse(String(init.body)).status };
        return json(current);
      }
      return json(current);
    });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("cancels a COD order being prepared and leaves a private note", async () => {
    const order = await cancelOrder("300", "7");
    expect(order.status).toBe("cancelled");
    expect(writes()).toEqual([
      { method: "PUT", path: "/wp-json/wc/v3/orders/300", body: { status: "cancelled" } },
      { method: "POST", path: "/wp-json/wc/v3/orders/300/notes", body: { note: "Cancelled by the customer from the storefront.", customer_note: false } },
    ]);
  });

  it("changes an already cancelled order no further", async () => {
    current = wc({ status: "cancelled" });
    expect((await cancelOrder("300", "7")).status).toBe("cancelled");
    expect(writes()).toEqual([]);
  });

  it("serializes a double click into one change", async () => {
    const [a, b] = await Promise.all([cancelOrder("300", "7"), cancelOrder("300", "7")]);
    expect([a.status, b.status]).toEqual(["cancelled", "cancelled"]);
    expect(writes().filter((w) => w.method === "PUT")).toHaveLength(1);
  });

  it("refuses orders that left, card orders, unknown statuses and other customers' orders", async () => {
    for (const [over, code] of [
      [{ status: "out-for-delivery" }, "not_cancellable"],
      [{ status: "processing", payment_method: "paymob" }, "not_cancellable"],
      [{ status: "shipped-by-courier" }, "not_cancellable"],
      [{ customer_id: 8 }, "not_found"],
    ] as [Partial<WcOrder>, string][]) {
      current = wc(over);
      await expect(cancelOrder("300", "7")).rejects.toMatchObject({ code });
    }
    expect(writes()).toEqual([]);
  });

  it("still cancels when the note fails", async () => {
    fetchMock.mockImplementationOnce(async () => json(current)).mockImplementationOnce(async (_u, init) => {
      current = { ...current, status: JSON.parse(String(init.body)).status };
      return json(current);
    }).mockImplementationOnce(async () => json({ code: "boom" }, 500));
    expect((await cancelOrder("300", "7")).status).toBe("cancelled");
  });

  it("requests a return within 14 days of delivery", async () => {
    current = wc({ status: "completed", date_completed: "2026-11-01T12:00:00", date_completed_gmt: "2026-11-01T10:00:00" });
    const order = await requestReturn("300", "7", { reason: "damaged", details: "<b>Lid</b> & handle" }, new Date("2026-11-10T00:00:00Z"));
    expect(order.status).toBe("return_requested");
    const [put, note] = writes();
    expect(put.body).toEqual({ status: "return-requested" });
    expect(note.body.note).toContain("Reason: Arrived damaged or not working");
    expect(note.body.note).toContain("Details: &lt;b&gt;Lid&lt;/b&gt; &amp; handle");
  });

  it("refuses a return after the window, before delivery, and repeats none", async () => {
    current = wc({ status: "completed", date_completed_gmt: "2026-10-01T10:00:00" });
    await expect(requestReturn("300", "7", { reason: "damaged", details: "" }, new Date("2026-11-10T00:00:00Z"))).rejects.toMatchObject({ code: "not_returnable", status: 409 });
    current = wc({ status: "processing" });
    await expect(requestReturn("300", "7", { reason: "damaged", details: "" })).rejects.toMatchObject({ code: "not_returnable" });
    current = wc({ status: "return-requested", date_completed_gmt: "2026-11-01T10:00:00" });
    expect((await requestReturn("300", "7", { reason: "damaged", details: "" })).status).toBe("return_requested");
    expect(writes()).toEqual([]);
  });
});

describe("order mapping for returns", () => {
  it("reads the delivery date in UTC", () => {
    expect(toOrder(wc({ status: "completed", date_completed: "2026-11-01T12:00:00", date_completed_gmt: "2026-11-01T10:00:00" })).deliveredAt).toBe("2026-11-01T10:00:00Z");
    expect(toOrder(wc({ status: "completed", date_completed: "2026-11-01T12:00:00" })).deliveredAt).toBe("2026-11-01T12:00:00");
    expect(toOrder(wc({ status: "return-requested" })).status).toBe("return_requested");
  });
  it("leaves out empty details", () => {
    expect(returnNote({ reason: "changed_mind", details: "" })).not.toContain("Details:");
  });
});
