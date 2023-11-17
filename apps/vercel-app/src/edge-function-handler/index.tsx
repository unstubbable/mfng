import {routerLocationAsyncLocalStorage} from '@mfng/core/router-location-async-local-storage';
import {
  createRscActionStream,
  createRscAppStream,
  createRscFormState,
} from '@mfng/core/server/rsc';
import {createHtmlStream} from '@mfng/core/server/ssr';
import * as React from 'react';
import type {ReactFormState} from 'react-dom/server';
import {App} from './app.js';
import {
  cssManifest,
  jsManifest,
  reactClientManifest,
  reactServerManifest,
  reactSsrManifest,
} from './manifests.js';

export default async function handler(request: Request): Promise<Response> {
  switch (request.method) {
    case `GET`:
      return handleGet(request);
    case `POST`:
      return handlePost(request);
    case `OPTIONS`:
      return new Response(null, {
        status: 204,
        headers: {Allow: `OPTIONS, GET, HEAD, POST`},
      });
    case `HEAD`:
      return new Response(null, {status: 200});
    default:
      return new Response(null, {status: 405});
  }
}

const oneDay = 60 * 60 * 24;

async function renderApp(
  request: Request,
  formState?: ReactFormState,
): Promise<Response> {
  const {pathname, search} = new URL(request.url);

  return routerLocationAsyncLocalStorage.run({pathname, search}, async () => {
    const rscAppStream = createRscAppStream(<App />, {
      reactClientManifest,
      mainCssHref: cssManifest[`main.css`]!,
      formState,
    });

    if (request.headers.get(`accept`) === `text/x-component`) {
      return new Response(rscAppStream, {
        headers: {
          'Content-Type': `text/x-component; charset=utf-8`,
          'Cache-Control': `s-maxage=60, stale-while-revalidate=${oneDay}`,
        },
      });
    }

    const htmlStream = await createHtmlStream(rscAppStream, {
      reactSsrManifest,
      bootstrapScripts: [jsManifest[`main.js`]!],
    });

    return new Response(htmlStream, {
      headers: {
        'Content-Type': `text/html; charset=utf-8`,
        'Cache-Control': `s-maxage=60, stale-while-revalidate=${oneDay}`,
      },
    });
  });
}

async function handleGet(request: Request): Promise<Response> {
  return renderApp(request);
}

async function handlePost(request: Request): Promise<Response> {
  const serverReferenceId = request.headers.get(`x-rsc-action`);

  if (serverReferenceId) {
    // POST via callServer:

    const contentType = request.headers.get(`content-type`);

    const body = await (contentType?.startsWith(`multipart/form-data`)
      ? request.formData()
      : request.text());

    const rscActionStream = await createRscActionStream({
      body,
      serverReferenceId,
      reactClientManifest,
      reactServerManifest,
    });

    return new Response(rscActionStream, {
      status: rscActionStream ? 200 : 500,
      headers: {'Content-Type': `text/x-component`},
    });
  } else {
    // POST before hydration (progressive enhancement):

    const formData = await request.formData();
    const formState = await createRscFormState(formData, reactServerManifest);

    return renderApp(request, formState);
  }
}
