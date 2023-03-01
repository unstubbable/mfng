declare module 'react-server-dom-webpack/client.browser' {
  import type {Thenable} from 'react';
  import type {WebpackMap} from 'react-server-dom-webpack';

  export interface CreateFromReadableStreamOptions {
    callServer?: CallServerCallback;
  }

  export type CallServerCallback = <TArgs, TResult>(
    {filepath: string, name: string},
    args: TArgs,
  ) => Promise<TResult>;

  export function createFromReadableStream<T>(
    stream: ReadableStream,
    options?: CreateFromReadableStreamOptions,
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
