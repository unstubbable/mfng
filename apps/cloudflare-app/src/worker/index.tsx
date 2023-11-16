import {routerLocationAsyncLocalStorage} from '@mfng/core/router-location-async-local-storage';
import {createRscActionStream, createRscAppStream} from '@mfng/core/server/rsc';
import {createHtmlStream} from '@mfng/core/server/ssr';
import * as React from 'react';
import {App} from './app.js';
import {
  cssManifest,
  jsManifest,
  reactClientManifest,
  reactServerManifest,
  reactSsrManifest,
} from './manifests.js';

const handleGet: ExportedHandlerFetchHandler = async (request) => {
  const {pathname, search} = new URL(request.url);

  return routerLocationAsyncLocalStorage.run({pathname, search}, async () => {
    const rscAppStream = createRscAppStream(<App />, {
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
  });
};

const handlePost: ExportedHandlerFetchHandler = async (request) => {
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

const handler: ExportedHandler = {
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
