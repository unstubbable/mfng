import {useRouterLocation} from '@mfng/core/use-router-location';
import * as React from 'react';
import {FastPage} from './fast-page.js';
import {HomePage} from './home-page.js';
import {SlowPage} from './slow-page.js';

export function Routes(): React.ReactNode {
  const {pathname} = useRouterLocation();

  switch (pathname) {
    case `/slow-page`:
      return <SlowPage />;
    case `/fast-page`:
      return <FastPage />;
    default:
      return <HomePage />;
  }
}
