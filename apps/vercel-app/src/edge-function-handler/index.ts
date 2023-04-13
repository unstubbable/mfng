import {createRscActionStream, createRscAppStream} from '@mfng/core/server/rsc';
import {createHtmlStream} from '@mfng/core/server/ssr';
import {createRscAppOptions} from './create-rsc-app-options.js';
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

async function handleGet(request: Request): Promise<Response> {
  const rscAppStream = createRscAppStream({
    ...createRscAppOptions({requestUrl: request.url}),
    reactClientManifest,
    mainCssHref: cssManifest[`main.css`]!,
  });

  if (request.headers.get(`accept`) === `text/x-component`) {
    return new Response(rscAppStream, {
      headers: {
        'Content-Type': `text/x-component`,
        'Cache-Control': `s-maxage=60, stale-while-revalidate=3600`,
        'Vary': `accept`,
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
      'Cache-Control': `s-maxage=60, stale-while-revalidate=3600`,
      'Vary': `accept`,
    },
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
    reactClientManifest,
    reactServerManifest,
  });

  if (!rscActionStream) {
    return new Response(null, {status: 500});
  }

  return new Response(rscActionStream, {
    headers: {'Content-Type': `text/x-component`},
  });
}
