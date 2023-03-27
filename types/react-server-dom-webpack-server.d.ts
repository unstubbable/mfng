declare module 'react-server-dom-webpack/server.edge' {
  import type {ReactElement, Thenable} from 'react';
  import type {
    ClientManifest,
    ReactClientValue,
    ReactServerValue,
  } from 'react-server-dom-webpack';

  export type LazyComponent<T, P> = {
    $$typeof: symbol | number;
    _payload: P;
    _init: (payload: P) => T;
  };

  export interface RenderToReadableStreamOptions {
    identifierPrefix?: string;
    signal?: AbortSignal;
    context?: [string, ServerContextJSONValue][];
    onError?: (error: unknown) => void;
  }

  export type ServerContextJSONValue =
    | string
    | boolean
    | number
    | null
    | ReadonlyArray<ServerContextJSONValue>
    | {[key: string]: ServerContextJSONValue};

  export function renderToReadableStream(
    model: ReactClientValue,
    webpackMap?: ClientManifest | null,
    options?: RenderToReadableStreamOptions,
  ): ReadableStream<Uint8Array>;

  export function decodeReply(body: string | FormData): Thenable<unknown[]>;
}
