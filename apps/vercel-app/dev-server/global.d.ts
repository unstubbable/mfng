import type * as Edge from '@edge-runtime/primitives';

declare global {
  var fetchEventListener: undefined | ((event: Edge.FetchEvent) => void);

  function removeEventListener(
    type: 'fetch',
    listener: (event: Edge.FetchEvent) => void,
  ): void;
}
