'use client';

import type {RscAppResult} from '@mfng/core/client';
import {callServer} from '@mfng/core/client/browser';
import * as React from 'react';
import ReactServerDOMClient from 'react-server-dom-webpack/client.browser';
import type {FeatureAppLoaderProps} from '../feature-app-loader.js';

const fetchRoot = async function fetchRoot(
  url: string,
): Promise<React.ReactElement> {
  const {root} = await ReactServerDOMClient.createFromFetch<RscAppResult>(
    fetch(url, {headers: {accept: `text/x-component-remote`}}),
    {callServer},
  );

  return root;
};

function FeatureAppRoot({url}: FeatureAppLoaderProps): JSX.Element {
  return React.use(fetchRoot(url));
}

export function FeatureAppLoader({url}: FeatureAppLoaderProps): JSX.Element {
  return (
    <React.Suspense fallback="🌀 Loading Feature App...">
      <FeatureAppRoot url={url} />
    </React.Suspense>
  );
}
