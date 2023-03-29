'use client';

import {clsx} from 'clsx';
import * as React from 'react';
import {NavigationContext} from './navigation-context.js';

export function NavigationContainer({
  children,
}: React.PropsWithChildren): JSX.Element {
  const {isPending, promise} = React.useContext(NavigationContext);

  React.use(promise);

  return (
    <div
      className={clsx(`opacity-100`, `transition-opacity`, {
        [`opacity-60`]: isPending,
      })}
    >
      {children}
    </div>
  );
}
