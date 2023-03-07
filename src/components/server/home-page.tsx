import * as React from 'react';
import {buy} from '../../server-actions/buy.js';
import {BuyButton} from '../client/buy-button.js';
import {Link} from '../client/link.js';
import {Hello} from './hello.js';
import {Suspended} from './suspended.js';

export function HomePage(): JSX.Element {
  return (
    <main>
      {/* @ts-expect-error */}
      <Hello />
      <React.Suspense fallback={<p>Loading...</p>}>
        {/* @ts-expect-error */}
        <Suspended />
      </React.Suspense>
      <BuyButton buy={buy} />
      <p>
        <Link pathname="/another-page">Navigate to another page</Link>
      </p>
    </main>
  );
}
