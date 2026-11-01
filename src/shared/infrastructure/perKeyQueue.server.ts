/**
 * Runs tasks for the same key one at a time (e.g. read-modify-write of one
 * customer's meta value). In-memory: correct for one Node server process;
 * several instances need a shared lock (W1 hosting).
 */
const queues = new Map<string, Promise<unknown>>();

export async function serializedPerKey<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const run = (queues.get(key) ?? Promise.resolve()).catch(() => undefined).then(fn);
  const tail = run.catch(() => undefined);
  queues.set(key, tail);
  try {
    return await run;
  } finally {
    if (queues.get(key) === tail) queues.delete(key);
  }
}
