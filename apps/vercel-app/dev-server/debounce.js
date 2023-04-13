/**
 * @template {Function} T
 * @param { T } func
 * @param {number} wait
 * @return {(...args: Parameters<T>) => void}
 */
export function debounce(func, wait) {
  /**
   * @type {NodeJS.Timeout | undefined}
   */
  let timeout;

  return (/** @type {unknown[]} */ ...args) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(null, args);
    }, wait);
  };
}
