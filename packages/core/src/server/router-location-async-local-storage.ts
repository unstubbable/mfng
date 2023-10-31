import {AsyncLocalStorage} from 'node:async_hooks';
import type {RouterLocation} from '../use-router-location.js';

export const routerLocationAsyncLocalStorage =
  new AsyncLocalStorage<RouterLocation>();
