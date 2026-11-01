import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import { cartFromStoreApi, type CartCaller, type StoreCart } from "@/modules/cart/index.server";
import type { Address } from "@/shared/kernel/Address";
import type { Checkout, PaymentMethod } from "../domain/Checkout";
import { packageOfRate, toCheckout, toStoreAddress } from "./checkoutMapper";
import type { StoreCheckoutCart, StoreCheckoutResult } from "./storeCheckoutDto";

export interface CheckoutResult {
  checkout: Checkout;
  cartToken: string;
}

const GATEWAY: Record<PaymentMethod, string> = { cod: "cod", card: "paymob" };

// Woo's checkout/coupon errors keep their machine code (mapWooError), but a
// rejected JWT is "sign in again" and a bad coupon gets one stable code.
const mapError = (status: number, payload: unknown) => {
  if (status === 401 || status === 403) return new AppError("unauthenticated", "Session expired", 401);
  const code = (payload as { code?: string } | null)?.code ?? "";
  if (code === "woocommerce_rest_cart_coupon_error") return new AppError("coupon_invalid", "Coupon cannot be used", 400);
  // Woo's own address check at checkout (e.g. a required field the shop adds).
  if (code.startsWith("woocommerce_rest_invalid_address")) return new AppError("invalid_address", "Check the delivery address", 400);
  return undefined;
};

async function store<T>(caller: CartCaller, path: string, body?: unknown): Promise<{ data: T; cartToken: string }> {
  const headers: Record<string, string> = { Authorization: `Bearer ${caller.jwt}` };
  if (caller.cartToken) headers["Cart-Token"] = caller.cartToken;
  const res = await wooFetch<T>({
    method: body === undefined ? "GET" : "POST",
    path: `/wc/store/v1${path}`,
    headers,
    body,
    mapError,
  });
  const cartToken = res.headers.get("cart-token") || caller.cartToken;
  if (!cartToken) throw new AppError("upstream_error", "Cart token missing", 502);
  return { data: res.data, cartToken };
}

const view = (dto: StoreCheckoutCart, cartToken: string): CheckoutResult => ({
  checkout: toCheckout(dto, cartFromStoreApi(dto as unknown as StoreCart).lines),
  cartToken,
});

// Mutations need a Cart-Token; the customer's cart hands one out on a read.
async function withCart(caller: CartCaller) {
  const { data, cartToken } = await store<StoreCheckoutCart>(caller, "/cart");
  return { dto: data, caller: { jwt: caller.jwt, cartToken } };
}

export async function getCheckout(caller: CartCaller): Promise<CheckoutResult> {
  const { data, cartToken } = await store<StoreCheckoutCart>(caller, "/cart");
  return view(data, cartToken);
}

/** Save the delivery address (also used for billing); Woo answers with the rates for it. */
export async function setAddress(caller: CartCaller, address: Address): Promise<CheckoutResult> {
  const { dto, caller: c } = await withCart(caller);
  const email = dto.billing_address?.email;
  const a = toStoreAddress(address);
  const { data, cartToken } = await store<StoreCheckoutCart>(c, "/cart/update-customer", {
    shipping_address: a,
    billing_address: { ...a, ...(email ? { email } : {}) },
  });
  return view(data, cartToken);
}

export async function selectShippingRate(caller: CartCaller, rateId: string): Promise<CheckoutResult> {
  const { dto, caller: c } = await withCart(caller);
  const packageId = packageOfRate(dto, rateId);
  if (packageId === null) throw new AppError("validation_error", "Unknown shipping rate", 400);
  const { data, cartToken } = await store<StoreCheckoutCart>(c, "/cart/select-shipping-rate", { package_id: packageId, rate_id: rateId });
  return view(data, cartToken);
}

export async function applyCoupon(caller: CartCaller, code: string): Promise<CheckoutResult> {
  const { caller: c } = await withCart(caller);
  const { data, cartToken } = await store<StoreCheckoutCart>(c, "/cart/apply-coupon", { code });
  return view(data, cartToken);
}

export async function removeCoupon(caller: CartCaller, code: string): Promise<CheckoutResult> {
  const { caller: c } = await withCart(caller);
  const { data, cartToken } = await store<StoreCheckoutCart>(c, "/cart/remove-coupon", { code });
  return view(data, cartToken);
}

/**
 * Place the order with the address already saved on the cart. Woo checks
 * stock, coupons and totals; its error codes are passed through.
 */
export async function placeOrder(
  caller: CartCaller,
  input: { paymentMethod: PaymentMethod; note: string }
): Promise<{ orderId: string; status: string; cartToken: string }> {
  const { dto, caller: c } = await withCart(caller);
  if (dto.items.length === 0) throw new AppError("cart_empty", "The cart is empty", 409);
  const { data, cartToken } = await store<StoreCheckoutResult>(c, "/checkout", {
    billing_address: dto.billing_address,
    shipping_address: dto.shipping_address,
    payment_method: GATEWAY[input.paymentMethod],
    customer_note: input.note,
  });
  return { orderId: String(data.order_id), status: data.status, cartToken };
}
