// @ts-nocheck
'use client';

import * as React from 'react';
import {serverFunctionImportedFromClient} from './server-function-imported-from-client.js';

export function ClientComponentWithServerAction({action}) {
  React.useEffect(() => {
    action().then(console.log);
    serverFunctionImportedFromClient().then(console.log);
  }, []);

  return null;
}
