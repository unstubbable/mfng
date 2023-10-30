import * as React from 'react';
import {createFetchElementStream} from './create-fetch-element-stream.js';
import type {RouterLocation} from './router-context.js';
import {RouterContext} from './router-context.js';

const fetchElementStream = createFetchElementStream(
  createUrlPath(document.location),
);

interface RouterState {
  readonly location: RouterLocation;
  readonly action: RouterAction;
}

type RouterAction = 'push' | 'replace' | 'pop';

export function Router(): JSX.Element {
  const [routerState, setRouterState] = React.useState<RouterState>(() => {
    const {pathname, search} = document.location;

    return {location: {pathname, search}, action: `pop`};
  });

  const [isPending, startTransition] = React.useTransition();

  const navigate = React.useCallback(
    (to: Partial<RouterLocation>, action: RouterAction) => {
      startTransition(() =>
        setRouterState(({location}) => ({
          location: {
            pathname: to.pathname ?? location.pathname,
            search: to.search ?? ``,
          },
          action,
        })),
      );
    },
    [],
  );

  const push = React.useCallback(
    (to: Partial<RouterLocation>) => navigate(to, `push`),
    [navigate],
  );

  const replace = React.useCallback(
    (to: Partial<RouterLocation>) => navigate(to, `replace`),
    [navigate],
  );

  React.useEffect(() => {
    const abortController = new AbortController();

    addEventListener(
      `popstate`,
      () => {
        const {pathname, search} = document.location;

        startTransition(() =>
          setRouterState({location: {pathname, search}, action: `pop`}),
        );
      },
      {signal: abortController.signal},
    );

    return () => abortController.abort();
  }, []);

  React.useEffect(() => {
    const {location, action} = routerState;

    if (action === `push`) {
      history.pushState(null, ``, createUrl(location));
    } else if (action === `replace`) {
      history.replaceState(null, ``, createUrl(location));
    }
  }, [routerState]);

  const elementStreamPromise = fetchElementStream(
    createUrlPath(routerState.location),
  );

  return (
    <RouterContext.Provider value={{isPending, push, replace}}>
      {React.use(elementStreamPromise)}
    </RouterContext.Provider>
  );
}

function createUrlPath(location: RouterLocation): string {
  const {pathname, search} = location;

  return `${pathname}${normalizeSearch(search)}`;
}

function createUrl(location: RouterLocation): URL {
  return new URL(createUrlPath(location), document.location.origin);
}

function normalizeSearch(search: string): string {
  return `${search.replace(/(^[^?].*)/, `?$1`)}`;
}
