// This is in a separate file so that we can configure webpack to use the
// `react-server` layer for this module, and therefore the dependencies (React,
// the server components, and the server contexts) will be imported with the
// required `react-server` condition.

import type {ServerContext} from '@mfng/core/server/rsc';
import * as React from 'react';
import {App} from '../components/server/app.js';
import {LocationServerContextName} from '../location-server-context.js';

export interface CreateRscAppOptions {
  readonly requestUrl: string;
}

export interface RscAppOptions {
  readonly app: React.ReactNode;
  readonly serverContexts?: ServerContext[];
}

export function createRscAppOptions(
  options: CreateRscAppOptions,
): RscAppOptions {
  const {requestUrl} = options;

  return {
    app: <App />,
    serverContexts: [[LocationServerContextName, requestUrl]],
  };
}
