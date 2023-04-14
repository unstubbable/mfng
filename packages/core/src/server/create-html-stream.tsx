import ReactDOMServer from 'react-dom/server.browser';
import type {SSRManifest} from 'react-server-dom-webpack';
import ReactServerDOMClient from 'react-server-dom-webpack/client.edge';
import {createBufferedTransformStream} from './create-buffered-transform-stream.js';
import {createInitialRscResponseTransformStream} from './create-initial-rsc-response-transform-stream.js';

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

  const htmlStream = await ReactDOMServer.renderToReadableStream(
    await ReactServerDOMClient.createFromReadableStream(rscStream1, {
      moduleMap: reactSsrManifest,
    }),
    {
      bootstrapScriptContent: rscResponseStreamBootstrapScriptContent,
      bootstrapScripts,
    },
  );

  return htmlStream
    .pipeThrough(createBufferedTransformStream())
    .pipeThrough(createInitialRscResponseTransformStream(rscStream2));
}
