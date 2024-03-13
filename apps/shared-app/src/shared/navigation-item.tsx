import {Link} from '@mfng/core/client';
import {useRouterLocation} from '@mfng/core/use-router-location';
import * as React from 'react';

export type NavigationItemProps = React.PropsWithChildren<{
  readonly pathname: string;
}>;

export function NavigationItem({
  children,
  pathname,
}: NavigationItemProps): React.ReactNode {
  const {pathname: currentPathname} = useRouterLocation();

  if (pathname === currentPathname) {
    return (
      <span className="inline-block rounded-md bg-zinc-800 py-1 px-3 text-zinc-50">
        {children}
      </span>
    );
  }

  return (
    <Link
      to={{pathname}}
      className="inline-block rounded-md py-1 px-3 text-zinc-200 hover:bg-zinc-600"
    >
      {children}
    </Link>
  );
}
