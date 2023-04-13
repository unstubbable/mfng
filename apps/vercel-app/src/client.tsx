import {createFetchElementStream} from '@mfng/core/client';
import {NavigationContext} from '@mfng/shared-app/navigation-context.js';
import {createBrowserHistory, createPath} from 'history';
import * as React from 'react';
import ReactDOMClient from 'react-dom/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'tailwindcss/tailwind.css';

const history = createBrowserHistory();
const initialUrlPath = createPath(history.location);
const fetchElementStream = createFetchElementStream(initialUrlPath);

function ClientRoot(): JSX.Element {
  const [location, setLocation] = React.useState(history.location);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(
    () =>
      history.listen(({location: newLocation}) =>
        startTransition(() => setLocation(newLocation)),
      ),
    [],
  );

  const elementStreamPromise = fetchElementStream(createPath(location));

  return (
    <NavigationContext.Provider
      value={{isPending, push: history.push, replace: history.replace}}
    >
      {React.use(elementStreamPromise)}
    </NavigationContext.Provider>
  );
}

React.startTransition(() => {
  ReactDOMClient.hydrateRoot(
    document,
    <React.StrictMode>
      <ClientRoot />
    </React.StrictMode>,
  );
});
