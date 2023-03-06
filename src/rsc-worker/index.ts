import {getAssetFromKV} from '@cloudflare/kv-asset-handler';
import staticContentManifest from '__STATIC_CONTENT_MANIFEST';
import * as React from 'react';
import type {WebpackMap} from 'react-server-dom-webpack';
import type {ReactModel} from 'react-server-dom-webpack/server';
import ReactServerDOMServer from 'react-server-dom-webpack/server';
import {App} from '../app.js';

const assetManifest = JSON.parse(staticContentManifest);

export interface RscWorkerEnv {
  __STATIC_CONTENT: {};
}

declare var __webpack_require__: (moduleId: string) => Record<string, unknown>;

const handleGet: ExportedHandlerFetchHandler<RscWorkerEnv> = async (
  request,
  env,
  ctx,
) => {
  const {origin} = new URL(request.url);
  const manifestUrl = new URL(`react-client-manifest.json`, origin);

  const moduleMapResponse = await getAssetFromKV(
    {request: new Request(manifestUrl), waitUntil: ctx.waitUntil.bind(ctx)},
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
};

const handlePost: ExportedHandlerFetchHandler<RscWorkerEnv> = async (
  request,
) => {
  const serverReferenceId = request.headers.get(`x-rsc-action`);
  const [moduleId, exportName] = serverReferenceId?.split(`#`) ?? [];

  if (!moduleId || !exportName) {
    console.error(
      `Invalid server reference ID: ${JSON.stringify(serverReferenceId)}`,
    );

    return new Response(null, {status: 400});
  }

  const action = __webpack_require__(moduleId)[exportName];

  if (!isValidServerReference(action)) {
    console.error(action, `is not a valid server reference.`);

    return new Response(null, {status: 500});
  }

  const args = (await request.json()) as unknown[];
  const actionPromise = action.apply(null, args);

  const rscStream = ReactServerDOMServer.renderToReadableStream(
    actionPromise,
    null,
    {
      onError: (error) => {
        console.error(error);

        return error instanceof Error ? error.message : `Unknown Error`;
      },
    },
  );

  return new Response(rscStream, {
    headers: {'content-type': `text/x-component`},
  });
};

export default <ExportedHandler<RscWorkerEnv>>{
  async fetch(request, env, ctx) {
    if (request.method === `GET`) {
      return handleGet(request, env, ctx);
    }

    if (request.method === `POST`) {
      return handlePost(request, env, ctx);
    }

    return new Response(null, {status: 405});
  },
};

function isValidServerReference(
  action: unknown,
): action is (...args: unknown[]) => Promise<ReactModel> {
  // TODO: Check against a server reference manifest.
  return (
    typeof action === `function` &&
    `$$typeof` in action &&
    action.$$typeof === Symbol.for(`react.server.reference`)
  );
}
