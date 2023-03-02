import type {Thenable} from 'react';
import type {ServerRef} from 'react-server-dom-webpack';
import ReactServerDOMClient from 'react-server-dom-webpack/client.browser';

export function callServer(ref: ServerRef, args: unknown): Thenable<unknown> {
  return ReactServerDOMClient.createFromFetch(
    fetch(`/`, {
      method: `POST`,
      headers: {
        'accept': `text/x-component`,
        'x-rsc-action': JSON.stringify(ref),
      },
      body: JSON.stringify(args),
    }),
  );
}
