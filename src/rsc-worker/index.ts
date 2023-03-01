import {getAssetFromKV} from '@cloudflare/kv-asset-handler';
import * as React from 'react';
import type {WebpackMap} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server';
import {App} from '../app.js';

export interface RscWorkerEnv {
  __STATIC_CONTENT: {};
  __STATIC_CONTENT_MANIFEST: string;
}

export default <ExportedHandler<RscWorkerEnv>>{
  async fetch(request, env, ctx) {
    const assetManifest = JSON.parse(env.__STATIC_CONTENT_MANIFEST);

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
