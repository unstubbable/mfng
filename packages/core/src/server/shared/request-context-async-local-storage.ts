import {AsyncLocalStorage} from 'node:async_hooks';
import type {RouterLocation} from '../../use-router-location.js';

export interface RequestContext {
  readonly routerLocation: RouterLocation;
  readonly isPrerender?: boolean;
}

export const requestContextAsyncLocalStorage =
  new AsyncLocalStorage<RequestContext>();
