import type {ServerManifest} from '@mfng/core/server/rsc';
import {createRscActionStream, createRscAppStream} from '@mfng/core/server/rsc';
import {createHtmlStream} from '@mfng/core/server/ssr';
import type {ClientManifest, SSRManifest} from 'react-server-dom-webpack';
import {createRscAppOptions} from './create-rsc-app-options.js';
import type {EnvWithStaticContent, HandlerParams} from './get-json-from-kv.js';
import {getJsonFromKv} from './get-json-from-kv.js';

const handleGet: ExportedHandlerFetchHandler<EnvWithStaticContent> = async (
  request,
  env,
  ctx,
) => {
  const params: HandlerParams = {request, env, ctx};

  const [reactClientManifest, reactSsrManifest, jsManifest, cssManifest] =
    await Promise.all([
      getJsonFromKv<ClientManifest>(
        `client/react-client-manifest.json`,
        params,
      ),
      getJsonFromKv<SSRManifest>(`client/react-ssr-manifest.json`, params),
      getJsonFromKv<Record<string, string>>(`client/js-manifest.json`, params),
      getJsonFromKv<Record<string, string>>(`client/css-manifest.json`, params),
    ]);

  const rscAppStream = createRscAppStream({
    ...createRscAppOptions({requestUrl: request.url}),
    reactClientManifest,
    mainCssHref: cssManifest[`main.css`]!,
  });

  if (request.headers.get(`accept`) === `text/x-component`) {
    return new Response(rscAppStream, {
      headers: {'Content-Type': `text/x-component; charset=utf-8`},
    });
  }

  const htmlStream = await createHtmlStream(rscAppStream, {
    reactSsrManifest,
    bootstrapScripts: [jsManifest[`main.js`]!],
  });

  return new Response(htmlStream, {
    headers: {'Content-Type': `text/html; charset=utf-8`},
  });
};

const handlePost: ExportedHandlerFetchHandler<EnvWithStaticContent> = async (
  request,
  env,
  ctx,
) => {
  const serverReferenceId = request.headers.get(`x-rsc-action`);

  if (!serverReferenceId) {
    console.error(`Missing server reference ("x-rsc-action" header).`);

    return new Response(null, {status: 400});
  }

  const body = await (request.headers
    .get(`content-type`)
    ?.startsWith(`multipart/form-data`)
    ? request.formData()
    : request.text());

  const params: HandlerParams = {request, env, ctx};

  const [reactClientManifest, reactServerManifest] = await Promise.all([
    getJsonFromKv<ClientManifest>(`client/react-client-manifest.json`, params),
    getJsonFromKv<ServerManifest>(`react-server-manifest.json`, params),
  ]);

  const rscActionStream = await createRscActionStream({
    body,
    serverReferenceId,
    reactClientManifest,
    reactServerManifest,
  });

  if (!rscActionStream) {
    return new Response(null, {status: 500});
  }

  return new Response(rscActionStream, {
    headers: {'Content-Type': `text/x-component`},
  });
};

const handler: ExportedHandler<EnvWithStaticContent> = {
  async fetch(request, env, ctx) {
    switch (request.method) {
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
