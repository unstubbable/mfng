import type {RouterLocation} from '../../use-router-location.js';
import {routerLocationAsyncLocalStorage} from './router-location-async-local-storage.js';

export function useRouterLocation(): RouterLocation {
  const routerLocation = routerLocationAsyncLocalStorage.getStore();

  if (!routerLocation) {
    throw new Error(
      `useRouterLocation was called outside of an asynchronous context initialized by calling routerLocationAsyncLocalStorage.run()`,
    );
  }

  return routerLocation;
}
