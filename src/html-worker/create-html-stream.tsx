import * as React from 'react';
import ReactDOMServer from 'react-dom/server.browser';
import ReactServerDOMClient from 'react-server-dom-webpack/client.edge';
import '../app.js'; // Ensure that the app code is included in the worker bundle.
import {ServerRoot} from '../server-root.js';
import {createBufferedTransformStream} from './create-buffered-transform-stream.js';
import {createInitialRscResponseTransformStream} from './create-initial-rsc-response-transform-stream.js';

export async function createHtmlStream(
  rscStream: ReadableStream<Uint8Array>,
): Promise<ReadableStream<Uint8Array>> {
  const [rscStream1, rscStream2] = rscStream.tee();

  const htmlStream = await ReactDOMServer.renderToReadableStream(
    <ServerRoot
      jsxStream={ReactServerDOMClient.createFromReadableStream(rscStream1)}
    />,
    {bootstrapScripts: [`/main.js`]},
  );

  return htmlStream
    .pipeThrough(createBufferedTransformStream())
    .pipeThrough(createInitialRscResponseTransformStream(rscStream2));
}
