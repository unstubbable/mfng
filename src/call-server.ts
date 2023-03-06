import type {Thenable} from 'react';
import ReactServerDOMClient from 'react-server-dom-webpack/client.browser';

export function callServer(id: string, args: unknown): Thenable<unknown> {
  return ReactServerDOMClient.createFromFetch(
    fetch(`/`, {
      method: `POST`,
      headers: {'accept': `text/x-component`, 'x-rsc-action': id},
      body: JSON.stringify(args),
    }),
  );
}
