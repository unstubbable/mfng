import * as React from 'react';
import type {ClientManifest} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server.edge';

export interface CreateRscAppStreamOptions {
  readonly app: React.ReactNode;
  readonly reactClientManifest: ClientManifest;
  readonly mainCssHref?: string;
}

export function createRscAppStream(
  options: CreateRscAppStreamOptions,
): ReadableStream<Uint8Array> {
  const {app, reactClientManifest, mainCssHref} = options;

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
  );
}
