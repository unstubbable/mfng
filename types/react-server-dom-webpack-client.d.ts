declare module 'react-server-dom-webpack/client.browser' {
  import type {Thenable} from 'react';
  import type {
    ClientManifest,
    ReactServerValue,
    ServerReference,
  } from 'react-server-dom-webpack';

  export interface ReactServerDomClientOptions {
    callServer?: CallServerCallback;
  }

  export type CallServerCallback = (
    id: string,
    args: ReactServerValue,
  ) => Thenable<unknown>;

  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: ReactServerDomClientOptions,
  ): Thenable<T>;

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: ReactServerDomClientOptions,
  ): Thenable<T>;

  export function encodeReply(
    value: ReactServerValue,
  ): Promise<string | FormData>;
}

declare module 'react-server-dom-webpack/client.edge' {
  import type {Thenable} from 'react';
  import type {SSRManifest} from 'react-server-dom-webpack';

  export interface CreateFromReadableStreamOptions {
    moduleMap?: SSRManifest;
  }

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: CreateFromReadableStreamOptions,
  ): Thenable<T>;
}
