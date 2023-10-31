'use client';

import * as React from 'react';
import type {RouterLocation} from '../use-router-location.js';

export interface RouterContextValue {
  readonly isPending: boolean;
  readonly push: (to: Partial<RouterLocation>) => void;
  readonly replace: (to: Partial<RouterLocation>) => void;
}

export const RouterContext = React.createContext<RouterContextValue>({
  isPending: false,
  push: () => undefined,
  replace: () => undefined,
});

export function useRouter(): RouterContextValue {
  return React.useContext(RouterContext);
}
