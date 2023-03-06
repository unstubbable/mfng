declare module 'react-server-dom-webpack/client.browser' {
  import type {Thenable} from 'react';
  import type {WebpackMap} from 'react-server-dom-webpack';

  export interface ReactServerDomClientOptions {
    callServer?: CallServerCallback;
  }

  export type CallServerCallback = (
    id: string,
    args: unknown,
  ) => Thenable<unknown>;

  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: ReactServerDomClientOptions,
  ): Thenable<T>;

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: ReactServerDomClientOptions,
  ): Thenable<T>;
}

declare module 'react-server-dom-webpack/client.edge' {
  import type {Thenable} from 'react';
  import type {WebpackMap} from 'react-server-dom-webpack';

  export interface CreateFromReadableStreamOptions {
    moduleMap?: WebpackMap;
  }

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: CreateFromReadableStreamOptions,
  ): Thenable<T>;
}
