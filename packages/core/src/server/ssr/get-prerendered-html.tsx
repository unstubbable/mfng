// eslint-disable-next-line import/order
import './node-compat-environment.js';

import * as React from 'react';
import type {PostponedState, ReactFormState} from 'react-dom/server';
import ReactDOMServer from 'react-dom/server.edge';
import ReactDOMStatic from 'react-dom/static.edge';
import type {SSRManifest} from 'react-server-dom-webpack';
import ReactServerDOMClient from 'react-server-dom-webpack/client.edge';
import type {RscAppResult} from '../rsc/create-rsc-app-stream.js';
import {createInitialRscResponseTransformStream} from './create-initial-rsc-response-transform-stream.js';

export interface GetPrerenderedHtmlOptions {
  readonly reactSsrManifest: SSRManifest;
  readonly bootstrapScripts?: string[];
  readonly formState?: ReactFormState;
  readonly prerenderCache: PrerenderCache;
}

export interface PrerenderCache {
  get(url: string): SerializedStaticResult | undefined;
  set(url: string, staticResult: SerializedStaticResult): void;
}

export interface SerializedStaticResult {
  readonly prelude: string;
  readonly postponed: string;
}

const rscResponseStreamBootstrapScriptContent = `(()=>{const t=new TransformStream(),w=t.writable.getWriter(),e=new TextEncoder();self.initialRscResponseStream=t.readable;self.addInitialRscResponseChunk=(text)=>w.write(e.encode(text))})()`;

export async function getPrerenderedHtml(
  url: string,
  rscStream: ReadableStream<Uint8Array>,
  options: GetPrerenderedHtmlOptions,
): Promise<ReadableStream<Uint8Array> | string> {
  const {reactSsrManifest, bootstrapScripts, formState, prerenderCache} =
    options;

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

  let cachedStaticResult = prerenderCache.get(url);

  if (!cachedStaticResult) {
    const {prelude, postponed} = await ReactDOMStatic.prerender(
      <ServerRoot />,
      {
        bootstrapScriptContent: rscResponseStreamBootstrapScriptContent,
        bootstrapScripts,
        formState,
      },
    );

    cachedStaticResult = {
      prelude: await streamToString(
        prelude.pipeThrough(
          createInitialRscResponseTransformStream(rscStream2),
        ),
      ),
      postponed: JSON.stringify(postponed),
    };

    prerenderCache.set(url, cachedStaticResult);
  }

  const cachedPostponed = JSON.parse(
    cachedStaticResult.postponed,
  ) as null | PostponedState;

  return cachedPostponed
    ? ReactDOMServer.resume(<ServerRoot />, cachedPostponed)
    : cachedStaticResult.prelude;
}

async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const textDecoder = new TextDecoder();
  let content = ``;

  while (true) {
    const {done, value} = await reader.read();

    if (done) {
      return content;
    }

    content += textDecoder.decode(value, {stream: true});
  }
}
