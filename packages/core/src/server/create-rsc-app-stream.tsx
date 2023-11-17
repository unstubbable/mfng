import * as React from 'react';
import type {ReactFormState} from 'react-dom/server';
import type {ClientManifest} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server.edge';

export interface CreateRscAppStreamOptions {
  readonly reactClientManifest: ClientManifest;
  readonly mainCssHref?: string;
  readonly formState?: ReactFormState;
}

export interface RscAppResult {
  readonly root: React.ReactElement;
  readonly formState?: ReactFormState;
}

export function createRscAppStream(
  app: React.ReactNode,
  options: CreateRscAppStreamOptions,
): ReadableStream<Uint8Array> {
  const {reactClientManifest, mainCssHref, formState} = options;

  const root = (
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
    </>
  );

  return ReactServerDOMServer.renderToReadableStream(
    {root, formState: formState as (string | number)[]},
    reactClientManifest,
  );
}
