export function toPlainObject(obj: unknown): object {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries([...value.entries()]);
      }

      if (value instanceof Set) {
        return [...value.values()];
      }

      return value;
    }),
  );
}
