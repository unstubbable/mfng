import * as React from 'react';
import {Link} from '../client/link.js';

export function Navigation(): JSX.Element {
  return (
    <nav>
      <ul>
        <li>
          <Link pathname="/">Home Page</Link>
        </li>
        <li>
          <Link pathname="/slow-page">A Slow Page</Link>
        </li>
        <li>
          <Link pathname="/fast-page">A Fast Page</Link>
        </li>
      </ul>
    </nav>
  );
}
