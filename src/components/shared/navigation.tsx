import * as React from 'react';
import {NavigationItem} from './navigation-item.js';

export function Navigation(): JSX.Element {
  return (
    <nav className="bg-zinc-700 px-4 py-3">
      <ul className="flex flex-col gap-y-2 gap-x-3 sm:flex-row">
        <li>
          <NavigationItem pathname="/">Home Page</NavigationItem>
        </li>
        <li>
          <NavigationItem pathname="/slow-page">A Slow Page</NavigationItem>
        </li>
        <li>
          <NavigationItem pathname="/fast-page">A Fast Page</NavigationItem>
        </li>
      </ul>
    </nav>
  );
}
