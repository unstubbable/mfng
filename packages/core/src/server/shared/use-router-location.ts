import type {RouterLocation} from '../../use-router-location.js';
import {requestContextAsyncLocalStorage} from './request-context-async-local-storage.js';

export function useRouterLocation(): RouterLocation {
  const requestContext = requestContextAsyncLocalStorage.getStore();

  if (!requestContext) {
    throw new Error(
      `useRouterLocation() was called outside of an asynchronous context initialized by calling requestContextAsyncLocalStorage.run()`,
    );
  }

  return requestContext.routerLocation;
}
