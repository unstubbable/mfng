'use client';

import * as React from 'react';

export interface UrlPathObject {
  readonly pathname: string;
  readonly search: string;
}

export interface RouterContextValue {
  readonly isPending: boolean;
  readonly push: (to: Partial<UrlPathObject>) => void;
  readonly replace: (to: Partial<UrlPathObject>) => void;
}

export const RouterContext = React.createContext<RouterContextValue>({
  isPending: false,
  push: () => undefined,
  replace: () => undefined,
});
