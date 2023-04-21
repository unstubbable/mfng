import * as React from 'react';
import type {RouterContextValue} from './router-context.js';
import {RouterContext} from './router-context.js';

export function useRouter(): RouterContextValue {
  return React.useContext(RouterContext);
}
