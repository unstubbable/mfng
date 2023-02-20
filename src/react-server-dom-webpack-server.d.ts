declare module 'react-server-dom-webpack/server.browser' {
  import type {ReactElement} from 'react';
  import type {WebpackSSRMap} from 'react-server-dom-webpack';

  export type ReactModel =
    | ReactElement
    | LazyComponent<any, any>
    | string
    | boolean
    | number
    | symbol
    | null
    | Iterable<ReactModel>
    | {[key: string]: ReactModel}
    | Promise<ReactModel>;

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
    model: ReactModel,
    webpackMap: WebpackSSRMap | null,
    options?: RenderToReadableStreamOptions,
  ): ReadableStream<Uint8Array>;
}
