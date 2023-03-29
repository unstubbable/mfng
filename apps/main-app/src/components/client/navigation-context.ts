'use client';

import type {To} from 'history';
import * as React from 'react';

export interface NavigationContextValue {
  readonly isPending: boolean;
  readonly promise: React.Thenable<unknown>;
  readonly push: (to: To) => void;
  readonly replace: (to: To) => void;
}

export const NavigationContext = React.createContext<NavigationContextValue>({
  isPending: false,
  promise: Promise.resolve(),
  push: () => undefined,
  replace: () => undefined,
});
