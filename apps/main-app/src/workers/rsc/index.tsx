import * as React from 'react';
import type {ClientManifest} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server.edge';
import {App} from '../../components/server/app.js';
import {LocationServerContextName} from '../../location-server-context.js';
import type {EnvWithStaticContent} from '../get-json-from-kv.js';
import {getJsonFromKv} from '../get-json-from-kv.js';

declare var __webpack_require__: (moduleId: string) => Record<string, unknown>;

type ServerManifest = Record<string, string[]>;

const handleGet: ExportedHandlerFetchHandler<EnvWithStaticContent> = async (
  request,
  env,
  ctx,
) => {
  const [reactClientManifest, cssManifest] = await Promise.all([
    getJsonFromKv(`client/react-client-manifest.json`, {request, env, ctx}),
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
        [LocationServerContextName, request.url],
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
  const [reactClientManifest, reactServerManifest] = await Promise.all([
    getJsonFromKv(`client/react-client-manifest.json`, {
      request,
      env,
      ctx,
    }) as Promise<ClientManifest>,
    getJsonFromKv(`react-server-manifest.json`, {
      request,
      env,
      ctx,
    }) as Promise<ServerManifest>,
  ]);

  const serverReferenceId = request.headers.get(`x-rsc-action`);
  const [moduleId, exportName] = serverReferenceId?.split(`#`) ?? [];

  if (!moduleId || !exportName) {
    console.error(
      `Invalid server reference ID: ${JSON.stringify(serverReferenceId)}`,
    );

    return new Response(null, {status: 400});
  }

  if (!reactServerManifest[moduleId]?.includes(exportName)) {
    console.error(
      `Unknown server reference ID: ${JSON.stringify(serverReferenceId)}`,
    );

    console.debug(
      `React server manifest:`,
      JSON.stringify(reactServerManifest, null, 2),
    );

    return new Response(null, {status: 400});
  }

  const action = __webpack_require__(moduleId)[exportName];

  if (typeof action !== `function`) {
    console.error(
      `The resolved server reference ${JSON.stringify(
        serverReferenceId,
      )} is not a function.`,
      action,
    );

    return new Response(null, {status: 500});
  }

  const body = await request.text();
  const args = await ReactServerDOMServer.decodeReply(body);
  const actionPromise = action.apply(null, args);

  const rscStream = ReactServerDOMServer.renderToReadableStream(
    actionPromise,
    reactClientManifest,
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
