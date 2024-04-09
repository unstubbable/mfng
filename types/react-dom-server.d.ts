import {RenderToReadableStreamOptions} from 'react-dom/server';

declare module 'react-dom/server' {
  export type ReactFormState = [
    unknown /* actual state value */,
    string /* key path */,
    string /* Server Reference ID */,
    number /* number of bound arguments */,
  ];

  export interface RenderToReadableStreamOptions {
    formState?: ReactFormState | null;
  }

  export interface PostponedState {
    nextSegmentId: number;
    rootFormatContext: unknown;
    progressiveChunkSize: number;
    resumableState: unknown;
    replayNodes: unknown[];
    replaySlots: unknown;
  }
}
