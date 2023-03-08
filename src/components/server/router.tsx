import * as React from 'react';
import {PathnameServerContext} from '../../pathname-server-context.js';
import {FastPage} from './fast-page.js';
import {HomePage} from './home-page.js';
import {SlowPage} from './slow-page.js';

export function Router(): JSX.Element {
  const pathname = React.useContext(PathnameServerContext);

  switch (pathname) {
    case `/slow-page`:
      // @ts-expect-error (async component)
      return <SlowPage />;
    case `/fast-page`:
      return <FastPage />;
    default:
      return <HomePage />;
  }
}
