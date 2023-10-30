declare module 'react-server-dom-webpack/client.edge' {
  import type {Thenable} from 'react';
  import type {SSRManifest} from 'react-server-dom-webpack';

  export interface CreateFromReadableStreamOptions {
    ssrManifest?: SSRManifest;
  }

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: CreateFromReadableStreamOptions,
  ): Thenable<T>;
}
