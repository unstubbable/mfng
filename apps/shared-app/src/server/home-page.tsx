import * as React from 'react';
import {Product} from '../client/product.js';
import {Main} from '../shared/main.js';
import {Hello} from './hello.js';
import {Suspended} from './suspended.js';

export function HomePage(): JSX.Element {
  return (
    <Main>
      <Hello />
      <React.Suspense fallback={<p className="my-3">Loading...</p>}>
        <Suspended />
      </React.Suspense>
      <React.Suspense>
        <Product />
      </React.Suspense>
    </Main>
  );
}
