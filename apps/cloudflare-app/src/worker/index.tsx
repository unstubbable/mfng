import type {Request} from '@cloudflare/workers-types';
import {routerLocationAsyncLocalStorage} from '@mfng/core/router-location-async-local-storage';
import {
  createRscActionStream,
  createRscAppStream,
  createRscFormState,
} from '@mfng/core/server/rsc';
import {
  type PartialPrerenderResult,
  createHtmlStream,
  partiallyPrerender,
  resumePartialPrerender,
} from '@mfng/core/server/ssr';
import * as React from 'react';
import type {PostponedState, ReactFormState} from 'react-dom/server';
import {App} from './app.js';
import {
  cssManifest,
  jsManifest,
  reactClientManifest,
  reactServerManifest,
  reactSsrManifest,
} from './manifests.js';

interface PrerenderCache {
  get(url: string): PartialPrerenderResult | undefined;
  set(url: string, result: PartialPrerenderResult): void;
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

  // TODO: Refactor to requestAsyncLocalStorage that contains location and
  // prerender/postpone status.
  return routerLocationAsyncLocalStorage.run({pathname, search}, async () => {
    const rscStream = createRscAppStream(<App />, {
      reactClientManifest,
      mainCssHref: cssManifest[`main.css`]!,
      formState,
    });

    const [prerenderRscStream, finalRscStream] = rscStream.tee();

    // TODO: Client-side navigation request should not get prerender stream
    // (with postponed elements).
    if (request.headers.get(`accept`) === `text/x-component`) {
      return new Response(prerenderRscStream, {
        headers: {'Content-Type': `text/x-component; charset=utf-8`},
      });
    }

    let cachedResult = prerenderCache.get(request.url);

    if (!cachedResult) {
      cachedResult = await partiallyPrerender(prerenderRscStream, {
        reactSsrManifest,
        bootstrapScripts: [jsManifest[`main.js`]!],
        formState,
      });

      prerenderCache.set(request.url, cachedResult);
    }

    const postponedState: PostponedState | null = JSON.parse(
      cachedResult.postponed,
    );

    if (postponedState) {
      const resumedRscStream = createRscAppStream(<App />, {
        reactClientManifest,
        mainCssHref: cssManifest[`main.css`]!,
        formState,
      });

      const resumedHtmlStream = await resumePartialPrerender(resumedRscStream, {
        postponedState: JSON.parse(cachedResult.postponed),
        reactSsrManifest,
      });

      return new Response(
        prependString(resumedHtmlStream, cachedResult.prelude),
        {headers: {'Content-Type': `text/html; charset=utf-8`}},
      );
    }

    const htmlStream = await createHtmlStream(finalRscStream, {
      reactSsrManifest,
      bootstrapScripts: [jsManifest[`main.js`]!],
      formState,
    });

    return new Response(htmlStream, {
      headers: {'Content-Type': `text/html; charset=utf-8`},
    });
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
