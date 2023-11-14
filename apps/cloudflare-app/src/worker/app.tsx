// This is in a separate file so that we can configure webpack to use the
// `react-server` layer for this module, and therefore the imported modules
// (React and the server components) will be imported with the required
// `react-server` condition.

import {App as SharedApp} from '@mfng/shared-app/app.js';
import * as React from 'react';

export function App(): JSX.Element {
  return (
    <SharedApp getTitle={(pathname) => `Cloudflare RSC/SSR demo ${pathname}`} />
  );
}
