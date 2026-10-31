import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import type { Cart } from "../domain/cart";
import { lineKeyFor, toCart } from "./storeCartMapper";
import type { StoreCart } from "./storeCartDto";

/** Who is asking: the customer's WordPress JWT and, if known, their Cart-Token. */
export interface CartCaller {
  jwt: string;
  cartToken: string | null;
}

export interface CartResult {
  cart: Cart;
  /** The token to keep for the next call (Woo may issue a new one). */
  cartToken: string;
}

export interface MergeResult extends CartResult {
  /** Lines Woo refused (out of stock, removed product), by product id. */
  skipped: string[];
}

// An expired or rejected JWT is "sign in again", not a shop outage.
const mapError = (status: number) =>
  status === 401 || status === 403 ? new AppError("unauthenticated", "Session expired", 401) : undefined;

async function call(
  caller: CartCaller,
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<{ dto: StoreCart; cartToken: string }> {
  const headers: Record<string, string> = { Authorization: `Bearer ${caller.jwt}` };
  if (caller.cartToken) headers["Cart-Token"] = caller.cartToken;
  const { data, headers: res } = await wooFetch<StoreCart>({
    method: init.method ?? "GET",
    path: `/wc/store/v1/cart${path}`,
    headers,
    body: init.body,
    mapError,
  });
  const cartToken = res.get("cart-token") || caller.cartToken;
  if (!cartToken) throw new AppError("upstream_error", "Cart token missing", 502);
  return { dto: data, cartToken };
}

// Mutations need a Cart-Token (otherwise Woo asks for a nonce); the
// customer's own cart hands one out on a plain read.
async function withToken(caller: CartCaller): Promise<CartCaller> {
  if (caller.cartToken) return caller;
  const { cartToken } = await call(caller, "");
  return { jwt: caller.jwt, cartToken };
}

const result = ({ dto, cartToken }: { dto: StoreCart; cartToken: string }): CartResult => ({
  cart: toCart(dto),
  cartToken,
});

export async function getCart(caller: CartCaller): Promise<CartResult> {
  return result(await call(caller, ""));
}

export async function addItem(caller: CartCaller, productId: string, quantity: number): Promise<CartResult> {
  const c = await withToken(caller);
  return result(await call(c, "/add-item", { method: "POST", body: { id: Number(productId), quantity } }));
}

/** Set a line's quantity by product id; 0 removes it. Unknown products are a no-op. */
export async function setQuantity(caller: CartCaller, productId: string, quantity: number): Promise<CartResult> {
  const current = await call(caller, "");
  const key = lineKeyFor(current.dto, productId);
  if (!key) return result(current);
  const c = { jwt: caller.jwt, cartToken: current.cartToken };
  return quantity > 0
    ? result(await call(c, "/update-item", { method: "POST", body: { key, quantity } }))
    : result(await call(c, "/remove-item", { method: "POST", body: { key } }));
}

export async function removeItem(caller: CartCaller, productId: string): Promise<CartResult> {
  return setQuantity(caller, productId, 0);
}

export async function clearCart(caller: CartCaller): Promise<CartResult> {
  const c = await withToken(caller);
  await wooFetch({
    method: "DELETE",
    path: "/wc/store/v1/cart/items",
    headers: { Authorization: `Bearer ${c.jwt}`, "Cart-Token": c.cartToken as string },
    mapError,
  });
  return getCart(c);
}

/**
 * Add the guest cart's lines to the customer's saved cart (quantities add
 * up, Woo caps them). A line Woo refuses is skipped, not fatal: the rest of
 * the guest cart still moves over.
 */
export async function mergeLines(
  caller: CartCaller,
  lines: { productId: string; quantity: number }[]
): Promise<MergeResult> {
  let c: CartCaller = await withToken(caller);
  const skipped: string[] = [];
  for (const line of lines) {
    try {
      const r = await call(c, "/add-item", { method: "POST", body: { id: Number(line.productId), quantity: line.quantity } });
      c = { jwt: c.jwt, cartToken: r.cartToken };
    } catch (err) {
      if (err instanceof AppError && err.status >= 400 && err.status < 500 && err.code !== "unauthenticated") {
        skipped.push(line.productId);
        continue;
      }
      throw err;
    }
  }
  return { ...(await getCart(c)), skipped };
}
