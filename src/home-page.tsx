import * as React from 'react';
import {BuyButton} from './client-components/buy-button.js';
import {Link} from './client-components/link.js';
import {Hello} from './hello.js';
import {buy} from './server-actions/buy.js';
import {Suspended} from './suspended.js';

export function HomePage(): JSX.Element {
  return (
    <main>
      <span style={{fontSize: `10px`}}>
        This is a first big chunk to prevent Safari from buffering the whole
        response before starting to render. Lorem ipsum dolor sit amet,
        consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean
        massa. Cum sociis natoque penatibus et magnis dis parturient montes,
        nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque
        eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede
        justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo,
        rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu
        pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum
        semper nisi.
      </span>
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
