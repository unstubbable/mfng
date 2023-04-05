import * as React from 'react';
import type {ClientManifest} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server.edge';

export interface CreateRscAppStreamOptions {
  readonly app: React.ReactNode;
  readonly reactClientManifest: ClientManifest;
  readonly mainCssHref?: string;
  readonly serverContexts?: ServerContext[];
}

export type ServerContext = [name: string, value: React.ServerContextJSONValue];

export function createRscAppStream(
  options: CreateRscAppStreamOptions,
): ReadableStream<Uint8Array> {
  const {app, reactClientManifest, mainCssHref, serverContexts} = options;

  return ReactServerDOMServer.renderToReadableStream(
    <>
      {mainCssHref && (
        <link
          rel="stylesheet"
          href={mainCssHref}
          // @ts-expect-error
          precedence="default"
        />
      )}
      {app}
    </>,
    reactClientManifest,
    {
      context: serverContexts && [
        [`WORKAROUND`, null], // TODO: First value has a bug where the value is not set on the second request: https://github.com/facebook/react/issues/24849
        ...serverContexts,
      ],
    },
  );
}
