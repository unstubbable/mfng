// eslint-disable-next-line import/order
import './node-compat-environment.js';

import * as React from 'react';
import type {PostponedState} from 'react-dom/server';
import ReactDOMServer from 'react-dom/server.edge';
import type {SSRManifest} from 'react-server-dom-webpack';
import ReactServerDOMClient from 'react-server-dom-webpack/client.edge';
import type {RscAppResult} from '../rsc/create-rsc-app-stream.js';
import {createInitialRscResponseTransformStream} from './create-initial-rsc-response-transform-stream.js';

export interface ResumePartialPrerenderOptions {
  readonly reactSsrManifest: SSRManifest;
  readonly postponedState: PostponedState;
}

export interface SerializedStaticResult {
  readonly prelude: string;
  readonly postponed: string;
}

export async function resumePartialPrerender(
  rscStream: ReadableStream<Uint8Array>,
  options: ResumePartialPrerenderOptions,
): Promise<ReadableStream<Uint8Array>> {
  const {reactSsrManifest, postponedState} = options;
  const [rscStream1, rscStream2] = rscStream.tee();

  let cachedRootPromise: Promise<React.ReactNode> | undefined;

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

  const htmlStream = await ReactDOMServer.resume(
    <ServerRoot />,
    postponedState,
    {onError: console.error},
  );

  return htmlStream.pipeThrough(
    createInitialRscResponseTransformStream(rscStream2),
  );
}
