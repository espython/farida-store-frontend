/**
 * The Store API places two orders when one cart is checked out twice at the
 * same time (spike-checkout.mjs). So placing an order is serialized per
 * customer, and a finished result is replayed for the same idempotency key
 * for a while: a double click or a retried request gets the same order back.
 *
 * In-memory: correct for one Next server process. With several instances or
 * serverless functions this needs a shared store (recorded for W1 hosting).
 */
const REPLAY_MS = 10 * 60 * 1000;
const MAX_REPLAYS = 1000;

const queues = new Map<string, Promise<unknown>>();
const replays = new Map<string, { at: number; value: unknown }>();

const prune = (now: number) => {
  replays.forEach((v, k) => {
    if (now - v.at > REPLAY_MS) replays.delete(k);
  });
  while (replays.size > MAX_REPLAYS) replays.delete(replays.keys().next().value as string);
};

/** Run `place` once per (customer, key); concurrent and repeated calls share the result. */
export async function placeOnce<T>(customerId: string, key: string, place: () => Promise<T>, now = Date.now): Promise<T> {
  const replayKey = `${customerId}:${key}`;
  const previous = queues.get(customerId) ?? Promise.resolve();
  const run = previous
    .catch(() => undefined)
    .then(async () => {
      prune(now());
      const hit = replays.get(replayKey);
      if (hit) return hit.value as T;
      const value = await place();
      replays.set(replayKey, { at: now(), value });
      return value;
    });
  const tail = run.catch(() => undefined);
  queues.set(customerId, tail);
  try {
    return await run;
  } finally {
    if (queues.get(customerId) === tail) queues.delete(customerId);
  }
}

/** Tests only. */
export const resetCheckoutGuard = () => {
  queues.clear();
  replays.clear();
};
