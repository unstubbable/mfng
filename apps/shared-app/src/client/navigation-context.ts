'use client';

import * as React from 'react';

export type To = string | Partial<Path>;

export interface Path {
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
}

export interface NavigationContextValue {
  readonly isPending: boolean;
  readonly push: (to: To) => void;
  readonly replace: (to: To) => void;
}

export const NavigationContext = React.createContext<NavigationContextValue>({
  isPending: false,
  push: () => undefined,
  replace: () => undefined,
});
