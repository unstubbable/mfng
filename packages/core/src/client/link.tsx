'use client';

import {useRouter} from '@mfng/core/client';
import type {RouterLocation} from '@mfng/core/use-router-location';
import {useRouterLocation} from '@mfng/core/use-router-location';
import * as React from 'react';
import {createUrlPath} from './router-location-utils.js';

export type LinkProps = React.PropsWithChildren<{
  readonly to: Partial<RouterLocation>;
  readonly action?: 'push' | 'replace';
  readonly className?: string;
}>;

export function Link({
  children,
  to,
  action = `push`,
  className,
}: LinkProps): React.ReactNode {
  const router = useRouter();
  const location = useRouterLocation();

  const urlPath = createUrlPath({
    pathname: to.pathname ?? location.pathname,
    search: to.search ?? ``,
  });

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      router[action](to);
    }
  };

  return (
    <a href={urlPath} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
