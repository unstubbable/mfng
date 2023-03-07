import {createHtmlStream} from './create-html-stream.js';

export interface MainWorkerEnv {
  RSC: Fetcher;
}

export default <ExportedHandler<MainWorkerEnv>>{
  async fetch(request, env) {
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

    const htmlStream = await createHtmlStream(rscResponse.body);

    return new Response(htmlStream, {
      headers: {'content-type': `text/html; charset=utf-8`},
    });
  },
};
