import * as React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'tailwindcss/tailwind.css';
import {PathnameServerContext} from '../../pathname-server-context.js';
import {NavigationContainer} from '../client/navigation-container.js';
import {Navigation} from '../shared/navigation.js';
import {Router} from './router.js';

export function App(): JSX.Element {
  const pathname = React.useContext(PathnameServerContext);

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Server Components with Streaming SSR Demo ${pathname}`}</title>
      </head>
      <body>
        <PathnameServerContext.Provider value={pathname}>
          <React.Suspense>
            <Navigation />
            <NavigationContainer>
              <Router />
            </NavigationContainer>
          </React.Suspense>
        </PathnameServerContext.Provider>
      </body>
    </html>
  );
}
