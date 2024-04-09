declare module 'react-dom/server.edge' {
  import type {ReactNode} from 'react';
  import type {
    PostponedState,
    ReactDOMServerReadableStream,
  } from 'react-dom/server';

  export {
    renderToNodeStream,
    renderToReadableStream,
    renderToStaticMarkup,
    renderToStaticNodeStream,
    renderToString,
    version,
  } from 'react-dom/server';

  export interface ResumeOptions {
    nonce?: string;
    signal?: AbortSignal;
    onError?: (error: unknown) => string | undefined;
    onPostpone?: (reason: string) => void;
  }

  export function resume(
    children: ReactNode,
    postponedState: PostponedState,
    options?: ResumeOptions,
  ): Promise<ReactDOMServerReadableStream>;
}
