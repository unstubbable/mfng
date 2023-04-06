import {createFetchElementStream} from '@mfng/core/client';
import {createBrowserHistory, createPath} from 'history';
import * as React from 'react';
import ReactDOMClient from 'react-dom/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'tailwindcss/tailwind.css';
import {ClientRoot} from './components/client/client-root.js';

const history = createBrowserHistory();
const initialUrlPath = createPath(history.location);

React.startTransition(() => {
  ReactDOMClient.hydrateRoot(
    document,
    <React.StrictMode>
      <ClientRoot
        history={history}
        fetchElementStream={createFetchElementStream(initialUrlPath)}
      />
    </React.StrictMode>,
  );
});
