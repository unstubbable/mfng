import * as React from 'react';
import {Product} from '../client/product.js';
import {Main} from '../shared/main.js';
import {buy} from './buy.js';
import {Hello} from './hello.js';
import {Postponed} from './postponed.js';
import {Suspended} from './suspended.js';

export function HomePage(): React.ReactNode {
  return (
    <Main>
      <Hello />
      <React.Suspense fallback={<p className="my-3">Loading...</p>}>
        <Suspended />
      </React.Suspense>
      <React.Suspense fallback={<p className="my-3">Loading...</p>}>
        <Postponed />
      </React.Suspense>
      <React.Suspense>
        <Product buy={buy.bind(null, `some-product-id`)} />
      </React.Suspense>
    </Main>
  );
}
