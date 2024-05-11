import * as React from 'react';
import type {ReactFormState} from 'react-dom/client';
import ReactDOMClient from 'react-dom/client';
import ReactServerDOMClient from 'react-server-dom-webpack/client.browser';
import {callServer} from './call-server.js';
import {createSimplePromiseCache} from './create-simple-promise-cache.js';
import {createUrlPath} from './router-location-utils.js';
import {Router} from './router.js';

export interface RscAppResult {
  readonly root: React.ReactElement;
  readonly formState?: ReactFormState;
}

export async function hydrateApp(): Promise<void> {
  const {root: initialRoot, formState} =
    await ReactServerDOMClient.createFromReadableStream<RscAppResult>(
      self.initialRscResponseStream,
      {callServer},
    );

  const initialUrlPath = createUrlPath(document.location);

  const fetchRoot = createSimplePromiseCache(
    async function fetchRoot(urlPath: string): Promise<React.ReactElement> {
      const {root} = await ReactServerDOMClient.createFromFetch<RscAppResult>(
        fetch(urlPath, {headers: {accept: `text/x-component`}}),
        {callServer},
      );

      return root;
    },
    [[initialUrlPath, Promise.resolve(initialRoot)]],
  );

  React.startTransition(() => {
    ReactDOMClient.hydrateRoot(
      document,
      <React.StrictMode>
        <Router fetchRoot={fetchRoot} />
      </React.StrictMode>,
      {formState},
    );
  });
}
