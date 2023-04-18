import * as React from 'react';
import {Product} from '../client/product.js';
import {Main} from '../shared/main.js';
import {buy} from './buy.js';
import {Hello} from './hello.js';
import {Suspended} from './suspended.js';

export function HomePage(): JSX.Element {
  return (
    <Main>
      {/* @ts-expect-error (async component) */}
      <Hello />
      <React.Suspense fallback={<p className="my-3">Loading...</p>}>
        {/* @ts-expect-error (async component) */}
        <Suspended />
      </React.Suspense>
      <React.Suspense>
        <Product buy={buy} />
      </React.Suspense>
    </Main>
  );
}
