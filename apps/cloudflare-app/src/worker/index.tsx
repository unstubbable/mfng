import type {Request} from '@cloudflare/workers-types';
import {requestContextAsyncLocalStorage} from '@mfng/core/request-context-async-local-storage';
import {
  createRscActionStream,
  createRscAppStream,
  createRscFormState,
} from '@mfng/core/server/rsc';
import {
  type PrerenderResult,
  prerender,
  resumePartialPrerender,
} from '@mfng/core/server/ssr';
import type {RouterLocation} from '@mfng/core/use-router-location';
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

interface PrerenderCache {
  get(url: string): PrerenderResult | undefined;
  set(url: string, result: PrerenderResult): void;
}

// TODO: Use a persistent cache; honor cache control headers.
const prerenderCache: PrerenderCache = new Map();

function prependString(stream: ReadableStream<Uint8Array>, text: string) {
  let reader: ReadableStreamDefaultReader<Uint8Array>;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      reader = stream.getReader();
    },

    async pull(controller) {
      try {
        while (controller.desiredSize === null || controller.desiredSize > 0) {
          const {done, value} = await reader.read();

          if (done) {
            controller.close();
            return;
          }

          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },

    async cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

// TODO: Move the React rendering into a Lambda handler, and the pure stream
// orchestration and prerender caching into a Cloudflare Worker.
async function renderApp(
  request: Request,
  formState?: ReactFormState,
): Promise<Response> {
  const {pathname, search} = new URL(request.url);
  const routerLocation: RouterLocation = {pathname, search};

  if (request.headers.get(`accept`) === `text/x-component`) {
    return requestContextAsyncLocalStorage.run(
      {routerLocation, isPrerender: false},
      () =>
        new Response(
          createRscAppStream(<App />, {
            reactClientManifest,
            mainCssHref: cssManifest[`main.css`]!,
            formState,
          }),
          {headers: {'Content-Type': `text/x-component; charset=utf-8`}},
        ),
    );
  }

  const prerenderResult =
    prerenderCache.get(request.url) ??
    (await requestContextAsyncLocalStorage.run(
      {routerLocation, isPrerender: true},
      async () => {
        const prerenderRscStream = createRscAppStream(<App />, {
          reactClientManifest,
          mainCssHref: cssManifest[`main.css`]!,
          formState,
        });

        const result = await prerender(prerenderRscStream, {
          reactSsrManifest,
          bootstrapScripts: [jsManifest[`main.js`]!],
          formState,
        });

        prerenderCache.set(request.url, result);

        return result;
      },
    ));

  if (prerenderResult.didPostpone) {
    const resumedHtmlStream = await requestContextAsyncLocalStorage.run(
      {routerLocation, isPrerender: false},
      async () => {
        const resumedRscStream = createRscAppStream(<App />, {
          reactClientManifest,
          mainCssHref: cssManifest[`main.css`]!,
          formState,
        });

        return resumePartialPrerender(resumedRscStream, {
          postponedState: prerenderResult.postponedState,
          reactSsrManifest,
        });
      },
    );

    return new Response(
      prependString(resumedHtmlStream, prerenderResult.prelude),
      {headers: {'Content-Type': `text/html; charset=utf-8`}},
    );
  }

  return new Response(prerenderResult.html, {
    headers: {'Content-Type': `text/html; charset=utf-8`},
  });
}

const handleGet: ExportedHandlerFetchHandler = async (request: Request) => {
  return renderApp(request);
};

const handlePost: ExportedHandlerFetchHandler = async (request: Request) => {
  const serverReferenceId = request.headers.get(`x-rsc-action`);

  if (serverReferenceId) {
    // POST via callServer:

    const contentType = request.headers.get(`content-type`);

    const body = await (contentType?.startsWith(`multipart/form-data`)
      ? (request.formData() as Promise<FormData>)
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

    const formData = await (request.formData() as Promise<FormData>);
    const formState = await createRscFormState(formData, reactServerManifest);

    return renderApp(request, formState);
  }
};

const handler: ExportedHandler = {
  async fetch(request: Request, env, ctx) {
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
