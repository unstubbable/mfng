import * as React from 'react';
import type {ClientManifest} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server.edge';
import {App} from '../components/server/app.js';
import {LocationServerContextName} from '../location-server-context.js';

export interface CreateRscAppStreamOptions {
  readonly requestUrl: string;
  readonly mainCssHref: string;
  readonly reactClientManifest: ClientManifest;
}

export function createRscAppStream(
  options: CreateRscAppStreamOptions,
): ReadableStream<Uint8Array> {
  const {requestUrl, mainCssHref, reactClientManifest} = options;

  return ReactServerDOMServer.renderToReadableStream(
    <>
      <link
        rel="stylesheet"
        href={mainCssHref}
        // @ts-expect-error
        precedence="default"
      />
      <App />
    </>,
    reactClientManifest,
    {
      context: [
        [`WORKAROUND`, null], // TODO: First value has a bug where the value is not set on the second request: https://github.com/facebook/react/issues/24849
        [LocationServerContextName, requestUrl],
      ],
    },
  );
}
