import type {History, Location} from 'history';
import * as React from 'react';
import {NavigationContext} from './navigation-context.js';

export interface ClientRootProps {
  readonly history: History;
  readonly fetchJsxStream: (location: Location) => React.Thenable<JSX.Element>;
}

export function ClientRoot({
  history,
  fetchJsxStream,
}: ClientRootProps): JSX.Element {
  const [location, setLocation] = React.useState(history.location);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(
    () =>
      history.listen(({location: newLocation}) =>
        startTransition(() => setLocation(newLocation)),
      ),
    [],
  );

  const jsxStreamPromise = fetchJsxStream(location);

  return (
    <NavigationContext.Provider
      value={{
        isPending,
        promise: jsxStreamPromise,
        push: history.push,
        replace: history.replace,
      }}
    >
      {React.use(jsxStreamPromise)}
    </NavigationContext.Provider>
  );
}