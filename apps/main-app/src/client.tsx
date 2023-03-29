import type {Location} from 'history';
import {createBrowserHistory, createPath} from 'history';
import * as React from 'react';
import ReactDOMClient from 'react-dom/client';
import ReactServerDOMClient from 'react-server-dom-webpack/client.browser';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'tailwindcss/tailwind.css';
import {callServer} from './call-server.js';
import {ClientRoot} from './components/client/client-root.js';

const history = createBrowserHistory();
const initialPath = createPath(history.location);

const initialJsxStream =
  ReactServerDOMClient.createFromReadableStream<JSX.Element>(
    self.initialRscResponseStream,
    {callServer},
  );

function fetchJsxStream(location: Location): React.Thenable<JSX.Element> {
  const path = createPath(location);

  if (path === initialPath) {
    return initialJsxStream;
  }

  return ReactServerDOMClient.createFromFetch(
    fetch(path, {headers: {accept: `text/x-component`}}),
    {callServer},
  );
}

React.startTransition(() => {
  ReactDOMClient.hydrateRoot(
    document,
    <ClientRoot
      history={history}
      fetchJsxStream={React.cache(fetchJsxStream)}
    />,
  );
});
