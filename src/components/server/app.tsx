import * as React from 'react';
import {PathnameServerContext} from '../../pathname-server-context.js';
import {NavigationContainer} from '../client/navigation-container.js';
import {Navigation} from './navigation.js';
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
      <body style={{fontFamily: `sans-serif`}}>
        <span style={{fontSize: `10px`}}>
          This is a first big chunk to prevent Safari from buffering the whole
          response before starting to render. Lorem ipsum dolor sit amet,
          consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean
          massa. Cum sociis natoque penatibus et magnis dis parturient montes,
          nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque
          eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede
          justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim
          justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum
          felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus
          elementum semper nisi.
        </span>

        <PathnameServerContext.Provider value={pathname}>
          <Navigation />
          <React.Suspense>
            <NavigationContainer>
              <React.Suspense fallback={<div>Loading...</div>}>
                <Router />
              </React.Suspense>
            </NavigationContainer>
          </React.Suspense>
        </PathnameServerContext.Provider>
      </body>
    </html>
  );
}
