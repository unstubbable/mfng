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
        headers: {'Content-Type': `text/x-component; charset=utf-8`},
      });
    }

    const htmlStream = await createHtmlStream(rscAppStream, {
      reactSsrManifest,
      bootstrapScripts: [jsManifest[`main.js`]!],
      formState,
    });

    return new Response(htmlStream, {
      headers: {'Content-Type': `text/html; charset=utf-8`},
    });
  });
}

const handleGet: ExportedHandlerFetchHandler = async (request) => {
  return renderApp(request);
};

const handlePost: ExportedHandlerFetchHandler = async (request) => {
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
