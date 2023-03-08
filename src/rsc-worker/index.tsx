import {getAssetFromKV} from '@cloudflare/kv-asset-handler';
import staticContentManifest from '__STATIC_CONTENT_MANIFEST';
import * as React from 'react';
import type {WebpackMap} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server';
import {App} from '../components/server/app.js';
import {PathnameServerContextName} from '../pathname-server-context.js';
import {isValidServerReference} from './is-valid-server-reference.js';

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
  const {origin, pathname} = new URL(request.url);
  const manifestUrl = new URL(`react-client-manifest.json`, origin);

  const moduleMapResponse = await getAssetFromKV(
    {request: new Request(manifestUrl), waitUntil: ctx.waitUntil.bind(ctx)},
    {ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest},
  );

  const moduleMap = (await moduleMapResponse.json()) as WebpackMap;

  const rscStream = ReactServerDOMServer.renderToReadableStream(
    <App />,
    moduleMap,
    {
      context: [
        [`WORKAROUND`, null], // TODO: First value has a bug where the value is not set on the second request: https://github.com/facebook/react/issues/24849
        [PathnameServerContextName, pathname],
      ],
    },
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

const handler: ExportedHandler<RscWorkerEnv> = {
  async fetch(request, env, ctx) {
    switch (request.method) {
      case `HEAD`:
        return new Response(null, {status: 200});
      case `GET`:
        return handleGet(request, env, ctx);
      case `POST`:
        return handlePost(request, env, ctx);
      default:
        return new Response(null, {status: 405});
    }
  },
};

export default handler;