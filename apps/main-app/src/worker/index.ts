import {createHtmlStream} from './create-html-stream.js';
import {createRscActionStream} from './create-rsc-action-stream.js';
import {createRscAppStream} from './create-rsc-app-stream.js';
import type {EnvWithStaticContent} from './get-json-from-kv.js';
import {readManifests} from './read-manifests.js';

export default <ExportedHandler<EnvWithStaticContent>>{
  async fetch(request, env, ctx) {
    const {
      reactServerManifest,
      reactSsrManifest,
      reactClientManifest,
      jsManifest,
      cssManifest,
    } = await readManifests({request, env, ctx});

    if (request.method === `POST`) {
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
        headers: {'content-type': `text/x-component`},
      });
    }

    const rscAppStream = createRscAppStream({
      requestUrl: request.url,
      mainCssHref: cssManifest[`main.css`]!,
      reactClientManifest,
    });

    if (request.headers.get(`accept`) === `text/x-component`) {
      return new Response(rscAppStream, {
        headers: {'content-type': `text/x-component`},
      });
    }

    const htmlStream = await createHtmlStream(rscAppStream, {
      reactSsrManifest,
      bootstrapScripts: [jsManifest[`main.js`]!],
    });

    return new Response(htmlStream, {
      headers: {'content-type': `text/html; charset=utf-8`},
    });
  },
};
