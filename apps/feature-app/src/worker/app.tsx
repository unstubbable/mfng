// This is in a separate file so that we can configure webpack to use the
// `react-server` layer for this module, and therefore the imported modules
// (React and the server components) will be imported with the required
// `react-server` condition.

import * as React from 'react';
import {Suspended} from './suspended.js';

export function App(): JSX.Element {
  return (
    <div>
      <React.Suspense fallback={<em>Loading...</em>}>
        <Suspended />
      </React.Suspense>
    </div>
  );
}
