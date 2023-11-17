import type {RouterLocation} from '../use-router-location.js';

export function createUrlPath(location: RouterLocation): string {
  const {pathname, search} = location;

  return `${pathname}${normalizeSearch(search)}`;
}

export function createUrl(location: RouterLocation): URL {
  return new URL(createUrlPath(location), document.location.origin);
}

function normalizeSearch(search: string): string {
  return `${search.replace(/(^[^?].*)/, `?$1`)}`;
}
