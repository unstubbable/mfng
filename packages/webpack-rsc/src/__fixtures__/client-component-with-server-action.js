// @ts-nocheck
'use client';

import * as React from 'react';
import {serverFunction} from './server-function.js';

export function ClientComponentWithServerAction() {
  React.useEffect(() => {
    serverFunction().then(console.log);
  }, []);

  return null;
}
