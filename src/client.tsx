import {createBrowserHistory} from 'history';
import * as React from 'react';
import ReactDOMClient from 'react-dom/client';
import ReactServerDOMClient from 'react-server-dom-webpack/client.browser';
import {callServer} from './call-server.js';
import {ClientRoot} from './components/client/client-root.js';
import {HistoryContext} from './hooks/use-history.js';

const initialPathname = location.pathname;

const initialJsxStream =
  ReactServerDOMClient.createFromReadableStream<JSX.Element>(
    self.initialRscResponseStream,
    {callServer},
  );

function fetchJsxStream(pathname: string): React.Thenable<JSX.Element> {
  if (pathname === initialPathname) {
    return initialJsxStream;
  }

  return ReactServerDOMClient.createFromFetch(
    fetch(pathname, {headers: {accept: `text/x-component`}}),
    {callServer},
  );
}

React.startTransition(() => {
  ReactDOMClient.hydrateRoot(
    document,
    <HistoryContext.Provider value={createBrowserHistory()}>
      <ClientRoot fetchJsxStream={React.cache(fetchJsxStream)} />
    </HistoryContext.Provider>,
  );
});
