// eslint-disable-next-line import/order
import './node-compat-environment.js';

import * as React from 'react';
import type {ReactFormState} from 'react-dom/server';
import ReactDOMServer from 'react-dom/server.edge';
import type {SSRManifest} from 'react-server-dom-webpack';
import ReactServerDOMClient from 'react-server-dom-webpack/client.edge';
import type {RscAppResult} from '../rsc/create-rsc-app-stream.js';
import {createBufferedTransformStream} from './create-buffered-transform-stream.js';
import {createInitialRscResponseTransformStream} from './create-initial-rsc-response-transform-stream.js';

export interface CreateHtmlStreamOptions {
  readonly reactSsrManifest: SSRManifest;
  readonly bootstrapScripts?: string[];
  readonly formState?: ReactFormState;
}

const rscResponseStreamBootstrapScriptContent = `(()=>{const t=new TransformStream(),w=t.writable.getWriter(),e=new TextEncoder();self.initialRscResponseStream=t.readable;self.addInitialRscResponseChunk=(text)=>w.write(e.encode(text))})()`;

export async function createHtmlStream(
  rscStream: ReadableStream<Uint8Array>,
  options: CreateHtmlStreamOptions,
): Promise<ReadableStream<Uint8Array>> {
  const {reactSsrManifest, bootstrapScripts, formState} = options;
  const [rscStream1, rscStream2] = rscStream.tee();

  let cachedRootPromise: Promise<React.ReactNode> | undefined;

  const getRoot = async () => {
    const {root} =
      await ReactServerDOMClient.createFromReadableStream<RscAppResult>(
        rscStream1,
        {ssrManifest: reactSsrManifest},
      );

    return root;
  };

  const ServerRoot = (): React.ReactNode => {
    // The root needs to be created during render, otherwise there will be no
    // current request defined that the chunk preloads can be attached to.
    cachedRootPromise ??= getRoot();

    return React.use(cachedRootPromise);
  };

  const htmlStream = await ReactDOMServer.renderToReadableStream(
    <ServerRoot />,
    {
      bootstrapScriptContent: rscResponseStreamBootstrapScriptContent,
      bootstrapScripts,
      formState,
    },
  );

  return htmlStream
    .pipeThrough(createBufferedTransformStream())
    .pipeThrough(createInitialRscResponseTransformStream(rscStream2));
}
