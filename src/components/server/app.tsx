import * as React from 'react';
import {NavigationContainer} from '../client/navigation-container.js';
import {Navigation} from './navigation.js';
import {Router} from './router.js';

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

        <Navigation />
        <React.Suspense>
          <NavigationContainer>
            <React.Suspense fallback={<div>Loading...</div>}>
              <Router pathname={pathname} />
            </React.Suspense>
          </NavigationContainer>
        </React.Suspense>
      </body>
    </html>
  );
}
