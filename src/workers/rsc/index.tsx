import * as React from 'react';
import type {ClientManifest} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server';
import {App} from '../../components/server/app.js';
import {PathnameServerContextName} from '../../pathname-server-context.js';
import type {EnvWithStaticContent} from '../get-json-from-kv.js';
import {getJsonFromKv} from '../get-json-from-kv.js';
import {isValidServerReference} from './is-valid-server-reference.js';

declare var __webpack_require__: (moduleId: string) => Record<string, unknown>;

const handleGet: ExportedHandlerFetchHandler<EnvWithStaticContent> = async (
  request,
  env,
  ctx,
) => {
  const [reactClientManifest, cssManifest] = await Promise.all([
    getJsonFromKv(`react-client-manifest.json`, {request, env, ctx}),
    getJsonFromKv(`client/css-manifest.json`, {request, env, ctx}),
  ]);

  const mainCssHref = (cssManifest as Record<string, string>)[`main.css`];

  const rscStream = ReactServerDOMServer.renderToReadableStream(
    <>
      <link
        rel="stylesheet"
        href={mainCssHref}
        // @ts-expect-error
        precedence="default"
      />
      <App />
    </>,
    reactClientManifest as ClientManifest,
    {
      context: [
        [`WORKAROUND`, null], // TODO: First value has a bug where the value is not set on the second request: https://github.com/facebook/react/issues/24849
        [PathnameServerContextName, new URL(request.url).pathname],
      ],
    },
  );

  return new Response(rscStream, {
    headers: {'content-type': `text/x-component`},
  });
};

const handlePost: ExportedHandlerFetchHandler<EnvWithStaticContent> = async (
  request,
  env,
  ctx,
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

  const body = await request.text();
  const args = await ReactServerDOMServer.decodeReply(body);
  const actionPromise = action.apply(null, args);

  const reactClientManifest = await getJsonFromKv(
    `react-client-manifest.json`,
    {request, env, ctx},
  );

  const rscStream = ReactServerDOMServer.renderToReadableStream(
    actionPromise,
    reactClientManifest as ClientManifest,
  );

  return new Response(rscStream, {
    headers: {'content-type': `text/x-component`},
  });
};

const handler: ExportedHandler<EnvWithStaticContent> = {
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
