// @ts-nocheck
'use client';

import * as React from 'react';

export function ClientComponent({action}) {
  React.useEffect(() => {
    action().then(console.log);
  }, []);

  return null;
}

export default ClientComponent;
