import {getAssetFromKV} from '@cloudflare/kv-asset-handler';
import staticContentManifest from '__STATIC_CONTENT_MANIFEST';
import {createHtmlStream} from './create-html-stream.js';

const assetManifest = JSON.parse(staticContentManifest);

export interface MainWorkerEnv {
  __STATIC_CONTENT: {};
  RSC: Fetcher;
}

export default <ExportedHandler<MainWorkerEnv>>{
  async fetch(request, env, ctx) {
    const rscResponse = await env.RSC.fetch(request);

    if (
      request.headers.get(`accept`) === `text/x-component` ||
      request.method === `HEAD`
    ) {
      return rscResponse;
    }

    if (!rscResponse.body) {
      throw new Error(`Empty body received from RSC worker.`);
    }

    const {origin} = new URL(request.url);
    const manifestUrl = new URL(`manifest.json`, origin);

    const manifestResponse = await getAssetFromKV(
      {request: new Request(manifestUrl), waitUntil: ctx.waitUntil.bind(ctx)},
      {ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest},
    );

    const manifest = (await manifestResponse.json()) as Record<string, string>;

    const htmlStream = await createHtmlStream(rscResponse.body, {
      bootstrapScripts: [manifest[`main.js`]!],
    });

    return new Response(htmlStream, {
      headers: {'content-type': `text/html; charset=utf-8`},
    });
  },
};
