import * as React from 'react';
import ReactDOMClient from 'react-dom/client';
import ReactServerDOMClient from 'react-server-dom-webpack/client';
import {ServerRoot} from './server-root.js';

const initialRscResponseStream = new ReadableStream({
  start(controller) {
    const textEncoder = new TextEncoder();

    for (const line of window.initialRscResponse) {
      controller.enqueue(textEncoder.encode(line));
    }
  },
});

const jsxStream = ReactServerDOMClient.createFromReadableStream<JSX.Element>(
  initialRscResponseStream,
);

React.startTransition(() => {
  ReactDOMClient.hydrateRoot(document, <ServerRoot jsxStream={jsxStream} />);
});
