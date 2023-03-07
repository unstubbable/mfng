'use client';

import * as React from 'react';
import {NavigationContext} from './navigation-context.js';

export function NavigationContainer({
  children,
}: React.PropsWithChildren): JSX.Element {
  const {isPending, promise} = React.useContext(NavigationContext);

  React.use(promise);

  return <div style={{opacity: isPending ? 0.6 : 1}}>{children}</div>;
}
