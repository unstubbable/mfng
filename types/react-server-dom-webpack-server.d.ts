declare module 'react-server-dom-webpack/server.edge' {
  import type {ReactElement, Thenable} from 'react';
  import type {ReactFormState} from 'react-dom/server';
  import type {
    ClientManifest,
    ReactClientValue,
    ReactServerValue,
    ServerManifest,
  } from 'react-server-dom-webpack';

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

  export function decodeReply(
    body: string | FormData,
    serverManifest: ServerManifest,
  ): Thenable<unknown[]>;

  export function decodeAction(
    body: FormData,
    serverManifest: ServerManifest,
  ): Promise<() => unknown> | null;

  export function decodeFormState(
    actionResult: unknown,
    body: FormData,
    serverManifest: ServerManifest,
  ): Promise<ReactFormState | null>;
}
