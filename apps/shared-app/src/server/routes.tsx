import * as React from 'react';
import {LocationServerContext} from '../shared/location-server-context.js';
import {FastPage} from './fast-page.js';
import {HomePage} from './home-page.js';
import {SlowPage} from './slow-page.js';

export function Routes(): JSX.Element {
  const location = React.useContext(LocationServerContext);
  const {pathname} = new URL(location);

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
