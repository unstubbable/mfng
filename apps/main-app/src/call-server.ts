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
    }),
  );
}
