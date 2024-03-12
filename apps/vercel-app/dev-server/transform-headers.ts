export function transformHeaders(
  headers: Headers,
): Record<string, string | string[]> {
  const headersRecord: Record<string, string | string[]> = {};

  headers.forEach((value, key) => {
    const prevValue = headersRecord[key];

    if (Array.isArray(prevValue)) {
      prevValue.push(value);
    } else if (typeof prevValue === `string`) {
      headersRecord[key] = [prevValue, value];
    } else {
      headersRecord[key] = value;
    }
  });

  return headersRecord;
}
