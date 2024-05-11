export function createSimplePromiseCache<T>(
  fn: (key: string) => Promise<T>,
  initialEntries?: [string, Promise<T>][],
): (key: string) => Promise<T> {
  const cache = new Map<string, Promise<T>>(initialEntries);

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return (key) => {
    const cachedPromise = cache.get(key);

    if (cachedPromise) {
      return cachedPromise;
    }

    const promise = fn(key);

    cache.set(key, promise);

    return promise;
  };
}
