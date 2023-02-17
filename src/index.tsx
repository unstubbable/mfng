import type {ProxyHandler} from 'aws-lambda';
import * as React from 'react';
import {renderToReadableStream} from 'react-server-dom-webpack/server.browser';
import {App} from './app.js';
import {convertStreamToString} from './convert-stream-to-string.js';

export const handler: ProxyHandler = async () => {
  const readableStream = renderToReadableStream(<App />, null);
  const result = await convertStreamToString(readableStream);

  return {statusCode: 200, body: result};
};
