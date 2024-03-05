// @ts-nocheck
'use client';

import * as React from 'react';
import {serverFunctionImportedFromClient} from './server-function-imported-from-client.js';

export function ClientComponentWithServerAction({action1, action2}) {
  React.useEffect(() => {
    action1().then(console.log);
    action2().then(console.log);
    serverFunctionImportedFromClient().then(console.log);
  }, []);

  return null;
}
