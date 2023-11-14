import {routerLocationAsyncLocalStorage} from '@mfng/core/router-location-async-local-storage';
import {createRscActionStream, createRscAppStream} from '@mfng/core/server/rsc';
import {createHtmlStream} from '@mfng/core/server/ssr';
import {createRscApp} from './create-rsc-app.js';
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

// eslint-disable-next-line @typescript-eslint/promise-function-async
function handleGet(request: Request): Promise<Response> {
  const {pathname, search} = new URL(request.url);

  return routerLocationAsyncLocalStorage.run({pathname, search}, async () => {
    const rscAppStream = createRscAppStream(createRscApp(), {
      reactClientManifest,
      mainCssHref: cssManifest[`main.css`]!,
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

async function handlePost(request: Request): Promise<Response> {
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
}
