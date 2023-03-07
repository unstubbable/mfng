'use client';

import * as React from 'react';
import {useHistory} from '../../hooks/use-history.js';

export type LinkProps = React.PropsWithChildren<{
  readonly pathname: string;
}>;

export function Link({children, pathname}: LinkProps): JSX.Element {
  const history = useHistory();

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault();
    history.push(pathname);
  };

  return (
    <a href={pathname} onClick={handleClick}>
      {children}
    </a>
  );
}
