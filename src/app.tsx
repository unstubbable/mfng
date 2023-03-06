import * as React from 'react';
import {AnotherPage} from './another-page.js';
import {HomePage} from './home-page.js';

export interface AppProps {
  readonly pathname: string;
}

export function App({pathname}: AppProps): JSX.Element {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Server Components with Streaming SSR Demo</title>
      </head>
      <body style={{fontFamily: `sans-serif`}}>
        {pathname === `/another-page` ? <AnotherPage /> : <HomePage />}
      </body>
    </html>
  );
}
