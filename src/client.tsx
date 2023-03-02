import * as React from 'react';
import ReactDOMClient from 'react-dom/client';
import ReactServerDOMClient from 'react-server-dom-webpack/client.browser';
import {callServer} from './call-server.js';
import {ServerRoot} from './server-root.js';

const jsxStream = ReactServerDOMClient.createFromReadableStream<JSX.Element>(
  self.initialRscResponseStream,
  {callServer},
);

React.startTransition(() => {
  ReactDOMClient.hydrateRoot(document, <ServerRoot jsxStream={jsxStream} />);
});
