'use client';

import * as React from 'react';
import type {RouterLocation} from '../use-router-location.js';

export const RouterLocationContext = React.createContext<
  RouterLocation | undefined
>(undefined);

export function useRouterLocation(): RouterLocation {
  const routerLocation = React.useContext(RouterLocationContext);

  if (!routerLocation) {
    throw new Error(
      `Called useRouterLocation() outside of a RouterLocationContext.Provider`,
    );
  }

  return routerLocation;
}
