import * as React from 'react';
import ReactDOMClient from 'react-dom/client';
import ReactServerDOMClient from 'react-server-dom-webpack/client';
import {ServerRoot} from './server-root.js';

const jsxStream = ReactServerDOMClient.createFromReadableStream<JSX.Element>(
  self.initialRscResponseStream,
);

React.startTransition(() => {
  ReactDOMClient.hydrateRoot(document, <ServerRoot jsxStream={jsxStream} />);
});
