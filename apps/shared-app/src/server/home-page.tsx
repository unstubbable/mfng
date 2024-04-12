import * as React from 'react';
import {Product} from '../client/product.js';
import {Main} from '../shared/main.js';
import {buy} from './buy.js';
import {Hello} from './hello.js';

export function HomePage(): React.ReactNode {
  return (
    <Main>
      <Hello />
      <React.Suspense>
        <div className="space-y-3">
          <Product name="Product A" buy={buy.bind(null, `a`)} />
          <Product name="Product B" buy={buy.bind(null, `b`)} />
        </div>
      </React.Suspense>
    </Main>
  );
}
