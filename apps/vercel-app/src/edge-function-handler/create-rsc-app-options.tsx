// This is in a separate file so that we can configure webpack to use the
// `react-server` layer for this module, and therefore the dependencies (React,
// the server components, and the server contexts) will be imported with the
// required `react-server` condition.

import type {ServerContext} from '@mfng/core/server/rsc';
import {App} from '@mfng/shared-app/app.js';
import {LocationServerContextName} from '@mfng/shared-app/location-server-context.js';
import * as React from 'react';

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
    app: (
      <App getTitle={(pathname) => `Vercel Edge RSC/SSR demo ${pathname}`} />
    ),
    serverContexts: [[LocationServerContextName, requestUrl]],
  };
}
