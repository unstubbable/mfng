declare module 'react-server-dom-webpack/client.browser' {
  import type {Thenable} from 'react';
  import type {
    ClientManifest,
    ReactServerValue,
    ServerReference,
  } from 'react-server-dom-webpack';

  export interface ReactServerDomClientOptions {
    callServer?: CallServerCallback;
    temporaryReferences?: TemporaryReferenceSet;
    findSourceMapURL?: FindSourceMapURLCallback;
    replayConsoleLogs?: boolean;
    environmentName?: string;
  }

  type TemporaryReferenceSet = Map<string, unknown>;

  export type CallServerCallback = (
    id: string,
    args: ReactServerValue,
  ) => Thenable<unknown>;

  export type EncodeFormActionCallback = <A>(
    id: any,
    args: Promise<A>,
  ) => ReactCustomFormAction;

  export type ReactCustomFormAction = {
    name?: string;
    action?: string;
    encType?: string;
    method?: string;
    target?: string;
    data?: null | FormData;
  };

  export type FindSourceMapURLCallback = (
    fileName: string,
    environmentName: string,
  ) => null | string;

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

  export function createServerReference(
    id: string,
    callServer: CallServerCallback,
    encodeFormAction?: EncodeFormActionCallback,
    findSourceMapURL?: FindSourceMapURLCallback, // DEV-only
    functionName?: string,
  ): (...args: unknown[]) => Promise<unknown>;
}
