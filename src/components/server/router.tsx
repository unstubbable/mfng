import * as React from 'react';
import {FastPage} from './fast-page.js';
import {HomePage} from './home-page.js';
import {SlowPage} from './slow-page.js';

export interface RouterProps {
  readonly pathname: string;
}

export function Router({pathname}: RouterProps): JSX.Element {
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
