declare module 'react-server-dom-webpack/client.edge' {
  import type {Thenable} from 'react';
  import type {SSRManifest} from 'react-server-dom-webpack';

  export interface ReactServerDomClientOptions {
    ssrManifest?: SSRManifest;
  }

  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: ReactServerDomClientOptions,
  ): Thenable<T>;

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: ReactServerDomClientOptions,
  ): Thenable<T>;
}
