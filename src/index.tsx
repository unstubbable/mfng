import type {ProxyHandler} from 'aws-lambda';
import * as React from 'react';
import ReactServerDOMServer from 'react-server-dom-webpack/server.browser';
import {App} from './app.js';
import {convertStreamToString} from './convert-stream-to-string.js';
import {createHtmlStream} from './create-html-stream.js';

export const handler: ProxyHandler = async (event) => {
  const rscStream = ReactServerDOMServer.renderToReadableStream(<App />, null);

  const result = await convertStreamToString(
    event.headers[`x-component`]
      ? rscStream
      : await createHtmlStream(rscStream),
  );

  return {statusCode: 200, body: result};
};
