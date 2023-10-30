// This is in a separate file so that we can configure webpack to use the
// `react-server` layer for this module, and therefore the imported modules
// (React and the server components) will be imported with the required
// `react-server` condition.

import {App} from '@mfng/shared-app/app.js';
import * as React from 'react';

export function createRscApp(): React.ReactNode {
  return <App getTitle={(pathname) => `Cloudflare RSC/SSR demo ${pathname}`} />;
}
