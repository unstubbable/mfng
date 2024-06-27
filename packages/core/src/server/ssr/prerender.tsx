// eslint-disable-next-line import/order
import './node-compat-environment.js';

import * as React from 'react';
import type {PostponedState, ReactFormState} from 'react-dom/server';
import ReactDOMStatic from 'react-dom/static.edge';
import type {SSRManifest} from 'react-server-dom-webpack';
import ReactServerDOMClient from 'react-server-dom-webpack/client.edge';
import type {RscAppResult} from '../rsc/create-rsc-app-stream.js';
import {createInitialRscResponseTransformStream} from './create-initial-rsc-response-transform-stream.js';

export interface PrerenderOptions {
  readonly reactSsrManifest: SSRManifest;
  readonly bootstrapScripts?: string[];
  readonly formState?: ReactFormState;
}

export interface PartialPrerenderResult {
  readonly didPostpone: true;
  readonly prelude: string;
  readonly postponedState: PostponedState;
}

export interface CompletePrerenderResult {
  readonly didPostpone: false;
  readonly html: string;
}

export type PrerenderResult = PartialPrerenderResult | CompletePrerenderResult;

// TODO: Share with createHtmlStream module.
const rscResponseStreamBootstrapScriptContent = `(()=>{const t=new TransformStream(),w=t.writable.getWriter(),e=new TextEncoder();self.initialRscResponseStream=t.readable;self.addInitialRscResponseChunk=(text)=>w.write(e.encode(text))})()`;

export async function prerender(
  rscStream: ReadableStream<Uint8Array>,
  options: PrerenderOptions,
): Promise<PrerenderResult> {
  const {reactSsrManifest, bootstrapScripts, formState} = options;

  let cachedRootPromise: Promise<React.ReactNode> | undefined;
  const [rscStream1, rscStream2] = rscStream.tee();

  // TODO: Extract server root logic to share with createHtmlStream module.
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

  const {prelude, postponed} = await ReactDOMStatic.prerender(<ServerRoot />, {
    bootstrapScriptContent: rscResponseStreamBootstrapScriptContent,
    bootstrapScripts,
    formState,
  });

  if (postponed) {
    return {
      didPostpone: true,
      prelude: await streamToString(
        prelude.pipeThrough(new TextDecoderStream()),
      ),
      postponedState: postponed,
    };
  }

  return {
    didPostpone: false,
    html: await streamToString(
      prelude
        .pipeThrough(createInitialRscResponseTransformStream(rscStream2))
        .pipeThrough(new TextDecoderStream()),
    ),
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
