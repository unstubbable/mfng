// eslint-disable-next-line import/order
import './node-compat-environment.js';

import * as React from 'react';
import type {ReactFormState} from 'react-dom/server';
import ReactDOMStatic from 'react-dom/static.edge';
import type {SSRManifest} from 'react-server-dom-webpack';
import ReactServerDOMClient from 'react-server-dom-webpack/client.edge';
import type {RscAppResult} from '../rsc/create-rsc-app-stream.js';

export interface PartiallyPrerenderOptions {
  readonly reactSsrManifest: SSRManifest;
  readonly bootstrapScripts?: string[];
  readonly formState?: ReactFormState;
}

export interface PartialPrerenderResult {
  readonly prelude: string;
  readonly postponed: string;
}

const rscResponseStreamBootstrapScriptContent = `(()=>{const t=new TransformStream(),w=t.writable.getWriter(),e=new TextEncoder();self.initialRscResponseStream=t.readable;self.addInitialRscResponseChunk=(text)=>w.write(e.encode(text))})()`;

export async function partiallyPrerender(
  rscStream: ReadableStream<Uint8Array>,
  options: PartiallyPrerenderOptions,
): Promise<PartialPrerenderResult> {
  const {reactSsrManifest, bootstrapScripts, formState} = options;

  let cachedRootPromise: Promise<React.ReactNode> | undefined;

  const getRoot = async () => {
    const {root} =
      await ReactServerDOMClient.createFromReadableStream<RscAppResult>(
        rscStream,
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

  const {prelude, postponed} = await ReactDOMStatic.prerender(<ServerRoot />, {
    bootstrapScriptContent: rscResponseStreamBootstrapScriptContent,
    bootstrapScripts,
    formState,
  });

  return {
    prelude: await streamToString(prelude.pipeThrough(new TextDecoderStream())),
    postponed: JSON.stringify(postponed),
  };
}

async function streamToString(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader();
  let content = ``;

  while (true) {
    const {done, value} = await reader.read();

    if (done) {
      return content;
    }

    content += value;
  }
}
