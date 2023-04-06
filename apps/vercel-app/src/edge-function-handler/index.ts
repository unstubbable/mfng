import type {ServerManifest} from '@mfng/core/server/rsc';
import {createRscActionStream, createRscAppStream} from '@mfng/core/server/rsc';
import {createHtmlStream} from '@mfng/core/server/ssr';
import type {ClientManifest, SSRManifest} from 'react-server-dom-webpack';
import {createRscAppOptions} from './create-rsc-app-options.js';

declare var REACT_SERVER_MANIFEST: ServerManifest;
declare var REACT_CLIENT_MANIFEST: ClientManifest;
declare var REACT_SSR_MANIFEST: SSRManifest;
declare var CSS_MANIFEST: Record<string, string>;
declare var JS_MANIFEST: Record<string, string>;

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

async function handleGet(request: Request): Promise<Response> {
  const rscAppStream = createRscAppStream({
    ...createRscAppOptions({requestUrl: request.url}),
    reactClientManifest: REACT_CLIENT_MANIFEST,
    mainCssHref: CSS_MANIFEST[`main.css`]!,
  });

  if (request.headers.get(`accept`) === `text/x-component`) {
    return new Response(rscAppStream, {
      headers: {'content-type': `text/x-component`},
    });
  }

  const htmlStream = await createHtmlStream(rscAppStream, {
    reactSsrManifest: REACT_SSR_MANIFEST,
    bootstrapScripts: [JS_MANIFEST[`main.js`]!],
  });

  return new Response(htmlStream, {
    headers: {'content-type': `text/html; charset=utf-8`},
  });
}

async function handlePost(request: Request): Promise<Response> {
  const serverReferenceId = request.headers.get(`x-rsc-action`);

  if (!serverReferenceId) {
    console.error(`Missing server reference ("x-rsc-action" header).`);

    return new Response(null, {status: 400});
  }

  const rscActionStream = await createRscActionStream({
    body: await request.text(),
    serverReferenceId,
    reactClientManifest: REACT_CLIENT_MANIFEST,
    reactServerManifest: REACT_SERVER_MANIFEST,
  });

  if (!rscActionStream) {
    return new Response(null, {status: 500});
  }

  return new Response(rscActionStream, {
    headers: {'content-type': `text/x-component`},
  });
}
