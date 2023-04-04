import * as React from 'react';
import {LocationServerContext} from '../../location-server-context.js';
import {NavigationContainer} from '../client/navigation-container.js';
import {Navigation} from '../shared/navigation.js';
import {Router} from './router.js';

export function App(): JSX.Element {
  const location = React.useContext(LocationServerContext);
  const {pathname} = new URL(location);

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Server Components with Streaming SSR Demo ${pathname}`}</title>
        <link rel="icon" href="/client/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <LocationServerContext.Provider value={location}>
          <React.Suspense>
            <Navigation />
            <NavigationContainer>
              <Router />
            </NavigationContainer>
          </React.Suspense>
        </LocationServerContext.Provider>
      </body>
    </html>
  );
}
