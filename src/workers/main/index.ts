import type {EnvWithStaticContent} from '../get-json-from-kv.js';
import {getJsonFromKv} from '../get-json-from-kv.js';
import {createHtmlStream} from './create-html-stream.js';

export interface MainWorkerEnv extends EnvWithStaticContent {
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

    const manifest = await getJsonFromKv(`js-manifest.json`, {
      request,
      env,
      ctx,
    });

    const htmlStream = await createHtmlStream(rscResponse.body, {
      bootstrapScripts: [(manifest as Record<string, string>)[`main.js`]!],
    });

    return new Response(htmlStream, {
      headers: {'content-type': `text/html; charset=utf-8`},
    });
  },
};
