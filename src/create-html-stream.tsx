import * as React from 'react';
import ReactDOMServer from 'react-dom/server.browser';
import ReactServerDOMClient from 'react-server-dom-webpack/client';
import {createInitialRscResponseTransformStream} from './create-initial-rsc-response-transform-stream.js';
import {ServerRoot} from './server-root.js';

export async function createHtmlStream(
  rscStream: ReadableStream<Uint8Array>,
): Promise<ReadableStream<Uint8Array>> {
  const [rscStream1, rscStream2] = rscStream.tee();

  const htmlStream = await ReactDOMServer.renderToReadableStream(
    <ServerRoot
      jsxStream={ReactServerDOMClient.createFromReadableStream(rscStream1)}
    />,
    {bootstrapScripts: [`/assets/main.js`]},
  );

  return htmlStream.pipeThrough(
    createInitialRscResponseTransformStream(rscStream2),
  );
}
