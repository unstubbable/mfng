// eslint-disable-next-line import/order
import './node-compat-environment.js';

import * as React from 'react';
import type {ReactFormState} from 'react-dom/server';
import ReactDOMServer from 'react-dom/server.edge';
import type {SSRManifest} from 'react-server-dom-webpack';
import ReactServerDOMClient from 'react-server-dom-webpack/client.edge';
import {createBufferedTransformStream} from './create-buffered-transform-stream.js';
import {createInitialRscResponseTransformStream} from './create-initial-rsc-response-transform-stream.js';
import type {RscAppResult} from './create-rsc-app-stream.js';

export interface CreateHtmlStreamOptions {
  readonly reactSsrManifest: SSRManifest;
  readonly bootstrapScripts?: string[];
}

const rscResponseStreamBootstrapScriptContent = `(()=>{const t=new TransformStream(),w=t.writable.getWriter(),e=new TextEncoder();self.initialRscResponseStream=t.readable;self.addInitialRscResponseChunk=(text)=>w.write(e.encode(text))})()`;

export async function createHtmlStream(
  rscStream: ReadableStream<Uint8Array>,
  options: CreateHtmlStreamOptions,
): Promise<ReadableStream<Uint8Array>> {
  const {reactSsrManifest, bootstrapScripts} = options;
  const [rscStream1, rscStream2] = rscStream.tee();

  let cachedRoot: Promise<React.ReactNode> | undefined;

  // @ts-expect-error This should be a tuple or undefined, but we need to assign
  // it inside of getRootAndAssignFormState, which happens after it is already
  // passed into ReactDOMServer.renderToReadableStream, unfortunately.
  // Hopefully, React will improve the ergonomics of this in the future.
  const lazyFormState: ReactFormState = [];

  const getRootAndAssignFormState = async () => {
    const {root, formState} =
      await ReactServerDOMClient.createFromReadableStream<RscAppResult>(
        rscStream1,
        {ssrManifest: reactSsrManifest},
      );

    Object.assign(lazyFormState, formState);

    return root;
  };

  const ServerRoot = (): React.ReactNode => {
    // The root needs to be created during render, otherwise there will be no
    // current request defined that the chunk preloads can be attached to.
    cachedRoot ??= getRootAndAssignFormState();

    return React.use(cachedRoot);
  };

  const htmlStream = await ReactDOMServer.renderToReadableStream(
    <ServerRoot />,
    {
      bootstrapScriptContent: rscResponseStreamBootstrapScriptContent,
      bootstrapScripts,
      formState: lazyFormState,
    },
  );

  return htmlStream
    .pipeThrough(createBufferedTransformStream())
    .pipeThrough(createInitialRscResponseTransformStream(rscStream2));
}
