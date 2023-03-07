import * as React from 'react';
import {buy} from '../../server-actions/buy.js';
import {BuyButton} from '../client/buy-button.js';
import {Hello} from './hello.js';
import {Suspended} from './suspended.js';

export function HomePage(): JSX.Element {
  return (
    <main>
      {/* @ts-expect-error (async component) */}
      <Hello />
      <React.Suspense fallback={<p>Loading...</p>}>
        {/* @ts-expect-error (async component) */}
        <Suspended />
      </React.Suspense>
      <React.Suspense>
        <BuyButton buy={buy} />
      </React.Suspense>
    </main>
  );
}
