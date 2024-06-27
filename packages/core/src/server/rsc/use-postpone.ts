import * as React from 'react';
import {requestContextAsyncLocalStorage} from '../shared/request-context-async-local-storage.js';

export function usePostpone(): void {
  const requestContext = requestContextAsyncLocalStorage.getStore();

  if (!requestContext) {
    throw new Error(
      `usePostpone() was called outside of an asynchronous context initialized by calling requestContextAsyncLocalStorage.run()`,
    );
  }

  if (requestContext.isPrerender) {
    return React.unstable_postpone();
  }
}
