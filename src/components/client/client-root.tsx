'use client';

import type {History} from 'history';
import * as React from 'react';
import {NavigationContext} from './navigation-context.js';

export interface ClientRootProps {
  readonly history: History;
  readonly fetchJsxStream: (pathname: string) => React.Thenable<JSX.Element>;
}

export function ClientRoot({
  history,
  fetchJsxStream,
}: ClientRootProps): JSX.Element {
  const [pathname, setPathname] = React.useState(history.location.pathname);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(
    () =>
      history.listen(({location}) =>
        startTransition(() => setPathname(location.pathname)),
      ),
    [],
  );

  const jsxStreamPromise = fetchJsxStream(pathname);

  return (
    <NavigationContext.Provider
      value={{isPending, promise: jsxStreamPromise, push: history.push}}
    >
      {React.use(jsxStreamPromise)}
    </NavigationContext.Provider>
  );
}
