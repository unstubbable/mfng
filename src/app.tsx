import * as React from 'react';
import {Hello} from './hello.js';

export function App(): JSX.Element {
  return (
    <html>
      <head>
        <title>Async Server Components Demo</title>
      </head>
      <body>
        {/* @ts-expect-error */}
        <Hello />
      </body>
    </html>
  );
}
