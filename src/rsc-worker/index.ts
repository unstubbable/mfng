import {getAssetFromKV} from '@cloudflare/kv-asset-handler';
import staticContentManifest from '__STATIC_CONTENT_MANIFEST';
import * as React from 'react';
import type {WebpackMap} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server';
import {App} from '../app.js';

const assetManifest = JSON.parse(staticContentManifest);

export interface RscWorkerEnv {
  __STATIC_CONTENT: {};
}

export default <ExportedHandler<RscWorkerEnv>>{
  async fetch(request, env, ctx) {
    const moduleMapResponse = await getAssetFromKV(
      {
        request: new Request(
          new URL(`react-client-manifest.json`, new URL(request.url).origin),
        ),
        waitUntil: ctx.waitUntil.bind(ctx),
      },
      {ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest},
    );

    const moduleMap = (await moduleMapResponse.json()) as WebpackMap;

    const rscStream = ReactServerDOMServer.renderToReadableStream(
      React.createElement(App),
      moduleMap,
    );

    return new Response(rscStream, {
      headers: {'content-type': `text/x-component`},
    });
  },
};
