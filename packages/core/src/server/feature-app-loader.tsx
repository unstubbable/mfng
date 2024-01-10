import * as React from 'react';
import ReactServerDOMClient from 'react-server-dom-webpack/client.edge';
import type {FeatureAppLoaderProps} from '../feature-app-loader.js';

interface RscAppResult {
  readonly root: React.ReactElement;
}

async function FeatureAppRoot({
  url,
}: FeatureAppLoaderProps): Promise<JSX.Element> {
  const {root} = await ReactServerDOMClient.createFromFetch<RscAppResult>(
    fetch(url, {headers: {accept: `text/x-component-remote`}}),
    {ssrManifest: {moduleMap: {}, moduleLoading: null}},
  );

  return root;
}

export function FeatureAppLoader({url}: FeatureAppLoaderProps): JSX.Element {
  return (
    <React.Suspense fallback="🌀 Loading Feature App...">
      <FeatureAppRoot url={url} />
    </React.Suspense>
  );
}
