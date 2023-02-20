import type {ProxyHandler} from 'aws-lambda';
import * as React from 'react';
import ReactDOMServer from 'react-dom/server.browser';
import ReactServerDOMClient from 'react-server-dom-webpack/client';
import ReactServerDOMServer from 'react-server-dom-webpack/server.browser';
import {App} from './app.js';
import {convertStreamToString} from './convert-stream-to-string.js';
import {ServerRoot} from './server-root.js';

export const handler: ProxyHandler = async (event) => {
  const rscStream = ReactServerDOMServer.renderToReadableStream(<App />, null);

  const result = await convertStreamToString(
    event.headers[`x-component`]
      ? rscStream
      : await ReactDOMServer.renderToReadableStream(
          <ServerRoot
            jsxStream={ReactServerDOMClient.createFromReadableStream(rscStream)}
          />,
        ),
  );

  return {statusCode: 200, body: result};
};
