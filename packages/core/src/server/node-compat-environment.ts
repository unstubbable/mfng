// This file should be imported before any others. It sets up the environment
// for later imports to work properly.

import {AsyncLocalStorage as NodeAsyncLocalStorage} from 'node:async_hooks';

declare global {
  var AsyncLocalStorage: typeof NodeAsyncLocalStorage;
}

// Expose AsyncLocalStorage as a global for react usage.
globalThis.AsyncLocalStorage = NodeAsyncLocalStorage;
