// Do not import CallServerError relatively. This must be the same import source
// as consumers would use it when importing it into their client components.
import {CallServerError} from '@mfng/core/client';
import type {ReactServerValue} from 'react-server-dom-webpack';
import ReactServerDOMClient from 'react-server-dom-webpack/client.browser';

export async function callServer(
  id: string,
  args: ReactServerValue,
): Promise<unknown> {
  return ReactServerDOMClient.createFromFetch(
    fetch(`/`, {
      method: `POST`,
      headers: {'accept': `text/x-component`, 'x-rsc-action': id},
      body: await ReactServerDOMClient.encodeReply(args),
    }).then((response) => {
      if (response.ok) {
        return response;
      }

      throw new CallServerError(response.statusText, response.status);
    }),
  );
}
