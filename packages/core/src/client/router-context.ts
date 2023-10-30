'use client';

import * as React from 'react';

export interface RouterLocation {
  readonly pathname: string;
  readonly search: string;
}

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
