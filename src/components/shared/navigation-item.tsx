import * as React from 'react';
import {PathnameServerContext} from '../../pathname-server-context.js';
import {Link} from '../client/link.js';

export type NavigationItemProps = React.PropsWithChildren<{
  readonly pathname: string;
}>;

export function NavigationItem({
  children,
  pathname,
}: NavigationItemProps): JSX.Element {
  const currentPathname = React.useContext(PathnameServerContext);

  if (pathname === currentPathname) {
    return (
      <span className="inline-block rounded-md bg-zinc-800 py-1 px-3 text-zinc-50">
        {children}
      </span>
    );
  }

  return (
    <Link pathname={pathname}>
      <span className="inline-block rounded-md py-1 px-3 text-zinc-200 hover:bg-zinc-600">
        {children}
      </span>
    </Link>
  );
}
