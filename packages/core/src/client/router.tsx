'use client';

import * as React from 'react';
import type {RouterLocation} from '../use-router-location.js';
import {createUrl, createUrlPath} from './router-location-utils.js';
import {RouterLocationContext} from './use-router-location.js';
import {RouterContext} from './use-router.js';

export interface RouterProps {
  readonly fetchRoot: (urlPath: string) => Promise<React.ReactElement>;
}

interface RouterState {
  readonly location: RouterLocation;
  readonly action: RouterAction;
}

type RouterAction = 'push' | 'replace' | 'pop';

export function Router({fetchRoot}: RouterProps): React.ReactNode {
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

  const rootPromise = fetchRoot(createUrlPath(routerState.location));

  return (
    <RouterContext.Provider value={{isPending, push, replace}}>
      <RouterLocationContext.Provider value={routerState.location}>
        {React.use(rootPromise)}
      </RouterLocationContext.Provider>
    </RouterContext.Provider>
  );
}
