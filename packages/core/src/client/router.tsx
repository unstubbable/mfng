import * as React from 'react';
import {createFetchElementStream} from './create-fetch-element-stream.js';
import type {UrlPathObject} from './router-context.js';
import {RouterContext} from './router-context.js';

const initialUrlPath = createUrlPath(document.location);
const fetchElementStream = createFetchElementStream(initialUrlPath);

export function Router(): JSX.Element {
  const [urlPath, setUrlPath] = React.useState(initialUrlPath);
  const [isPending, startTransition] = React.useTransition();

  const handleChange = React.useCallback(() => {
    startTransition(() => setUrlPath(createUrlPath(document.location)));
  }, []);

  const push = React.useCallback(
    (to: Partial<UrlPathObject>) => {
      history.pushState(null, ``, createUrl(to));
      handleChange();
    },
    [handleChange],
  );

  const replace = React.useCallback(
    (to: Partial<UrlPathObject>) => {
      history.replaceState(null, ``, createUrl(to));
      handleChange();
    },
    [handleChange],
  );

  React.useEffect(() => {
    const abortController = new AbortController();

    addEventListener(`popstate`, handleChange, {
      signal: abortController.signal,
    });

    return () => abortController.abort();
  }, []);

  const elementStreamPromise = fetchElementStream(urlPath);

  return (
    <RouterContext.Provider value={{isPending, push, replace}}>
      {/* @ts-expect-error will be fixed with TS 5.1 */}
      {elementStreamPromise}
    </RouterContext.Provider>
  );
}

function createUrlPath(to: Partial<UrlPathObject>): string {
  const {pathname = ``, search = ``} = to;

  return `${pathname}${normalizeSearch(search)}`;
}

function createUrl(to: Partial<UrlPathObject>): URL {
  const {pathname = document.location.pathname, search} = to;

  return new URL(createUrlPath({pathname, search}), document.location.origin);
}

function normalizeSearch(search: string): string {
  return `${search.replace(/(^[^?].*)/, `?$1`)}`;
}
