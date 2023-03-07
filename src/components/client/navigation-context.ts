import * as React from 'react';

export interface NavigationContextValue {
  readonly isPending: boolean;
  readonly promise: React.Thenable<unknown>;
}

export const NavigationContext = React.createContext<NavigationContextValue>({
  isPending: false,
  promise: Promise.resolve(),
});
