import type {ProxyHandler} from 'aws-lambda';
import * as React from 'react';
import ReactDOMServer from 'react-dom/server.browser';
import ReactServerDOMServer from 'react-server-dom-webpack/server.browser';
import {App} from './app.js';
import {convertStreamToString} from './convert-stream-to-string.js';

export const handler: ProxyHandler = async (event) => {
  const readableStream = await (event.headers[`x-component`]
    ? ReactServerDOMServer.renderToReadableStream(<App />, null)
    : ReactDOMServer.renderToReadableStream(<App />));

  const result = await convertStreamToString(readableStream);

  return {statusCode: 200, body: result};
};
