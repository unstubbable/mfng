'use client';

import type {To} from 'history';
import * as React from 'react';

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
