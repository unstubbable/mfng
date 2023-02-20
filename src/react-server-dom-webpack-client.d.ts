declare module 'react-server-dom-webpack/client' {
  import type {Thenable} from 'react';
  import type {WebpackSSRMap} from 'react-server-dom-webpack';

  export interface CreateFromReadableStreamOptions {
    moduleMap?: WebpackSSRMap;
  }

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: CreateFromReadableStreamOptions,
  ): Thenable<T>;
}
