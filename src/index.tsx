import * as React from 'react';
import ReactServerDOMServer from 'react-server-dom-webpack/server.browser';
import {App} from './app.js';
import {convertStreamToString} from './convert-stream-to-string.js';
import {createHtmlStream} from './create-html-stream.js';

export default {
  async fetch(request: Request): Promise<Response> {
    const rscStream = ReactServerDOMServer.renderToReadableStream(
      <App />,
      null,
    );

    const result = await convertStreamToString(
      request.headers.has(`x-component`)
        ? rscStream
        : await createHtmlStream(rscStream),
    );

    return new Response(result, {
      headers: {
        'content-type': `text/html; charset=utf-8`,
        'transfer-encoding': `chunked`,
      },
    });
  },
};
