'use client';

import * as React from 'react';
import {NavigationContext} from './navigation-context.js';

export type LinkProps = React.PropsWithChildren<{
  readonly pathname: string;
}>;

export function Link({children, pathname}: LinkProps): JSX.Element {
  const {push} = React.useContext(NavigationContext);

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault();
    push(pathname);
  };

  return (
    <a href={pathname} onClick={handleClick}>
      {children}
    </a>
  );
}
