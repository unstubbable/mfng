import * as React from 'react';
import {Hello} from './hello.js';
import {Suspended} from './suspended.js';

export function App(): JSX.Element {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Async Server Components Demo</title>
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
        {/* @ts-expect-error */}
        <Hello />
        <React.Suspense fallback="Loading...">
          {/* @ts-expect-error */}
          <Suspended />
        </React.Suspense>
      </body>
    </html>
  );
}
