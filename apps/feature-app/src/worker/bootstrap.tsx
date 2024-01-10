import * as React from 'react';
import {App} from './app.js';

export function Bootstrap(): JSX.Element {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MFNG Feature App</title>
        <link rel="icon" href="/client/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <App />
      </body>
    </html>
  );
}
