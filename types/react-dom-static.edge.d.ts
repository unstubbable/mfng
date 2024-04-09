declare module 'react-dom/static.edge' {
  import type {ErrorInfo, ReactNode} from 'react';
  import type {
    PostponedState,
    RenderToReadableStreamOptions,
  } from 'react-dom/server';

  export type PostponeInfo = ErrorInfo;

  export interface ImportMap {
    imports?: {
      [specifier: string]: string;
    };
    scopes?: {
      [scope: string]: {
        [specifier: string]: string;
      };
    };
  }

  export interface PrerenderOptions extends RenderToReadableStreamOptions {
    onPostpone?: (reason: string, postponeInfo: PostponeInfo) => void;
    importMap?: ImportMap;
    onHeaders?: (headers: Headers) => void;
    maxHeadersLength?: number;
  }

  export interface StaticResult {
    postponed: PostponedState | null;
    prelude: ReadableStream;
  }

  export function prerender(
    children: ReactNode,
    options?: PrerenderOptions,
  ): Promise<StaticResult>;
}
