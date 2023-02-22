import * as React from 'react';
import ReactServerDOMServer from 'react-server-dom-webpack/server.browser';
import {App} from './app.js';
import {createHtmlStream} from './create-html-stream.js';

export default {
  async fetch(request: Request): Promise<Response> {
    const rscStream = ReactServerDOMServer.renderToReadableStream(
      <App />,
      null,
    );

    const responseStream = request.headers.has(`x-component`)
      ? rscStream
      : await createHtmlStream(rscStream);

    return new Response(responseStream, {
      headers: {'content-type': `text/html; charset=utf-8`},
    });
  },
};
