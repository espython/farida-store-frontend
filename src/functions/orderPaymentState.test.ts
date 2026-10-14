import { describe, expect, it } from "vitest";
import { getOrderPaymentDisplay } from "./orderPaymentState";

describe("getOrderPaymentDisplay", () => {
  it("never reports an unsettled card as completed", () => {
    const r = getOrderPaymentDisplay({
      payment_status: "pending",
      paymob_order_id: "12345",
    });
    expect(r.status).toBe("pending");
    expect(r.method).toBe("online");
  });

  it("reports a paid card with ids from the columns", () => {
    const r = getOrderPaymentDisplay({
      payment_status: "paid",
      payment_transaction_id: "TXN-9",
      paymob_order_id: "12345",
    });
    expect(r).toMatchObject({
      status: "completed",
      method: "online",
      transactionId: "TXN-9",
      paymobOrderId: "12345",
    });
  });

  it("reports a failed card", () => {
    expect(getOrderPaymentDisplay({ payment_status: "failed" }).status).toBe(
      "failed"
    );
  });

  it("treats COD as pending and drops stray card ids", () => {
    const r = getOrderPaymentDisplay({
      payment_status: "cod",
      payment_transaction_id: "STRAY",
      paymob_order_id: "STRAY2",
    });
    expect(r).toMatchObject({
      isCod: true,
      method: "cod",
      status: "pending",
      transactionId: null,
      paymobOrderId: null,
    });
  });

  it.each([undefined, null, {}, { payment_status: null }])(
    "stays honest for missing input %j",
    (input) => {
      const r = getOrderPaymentDisplay(input);
      expect(r.status).toBe("unknown");
      expect(r.isCod).toBe(false);
    }
  );
});
