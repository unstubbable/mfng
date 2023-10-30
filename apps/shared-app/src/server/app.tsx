import {useRouterLocation} from '@mfng/core/use-router-location';
import * as React from 'react';
import {NavigationContainer} from '../client/navigation-container.js';
import {Navigation} from '../shared/navigation.js';
import {Routes} from './routes.js';

export interface AppProps {
  readonly getTitle: (pathname: string) => string;
}

export function App({getTitle}: AppProps): JSX.Element {
  const {pathname} = useRouterLocation();

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{getTitle(pathname)}</title>
        <link rel="icon" href="/client/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <React.Suspense>
          <Navigation />
          <NavigationContainer>
            <Routes />
          </NavigationContainer>
        </React.Suspense>
      </body>
    </html>
  );
}
