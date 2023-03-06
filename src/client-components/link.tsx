'use client';

import * as React from 'react';

export type LinkProps = React.PropsWithChildren<{
  readonly pathname: string;
}>;

export function Link({children, pathname}: LinkProps): JSX.Element {
  return <a href={pathname}>{children}</a>;
}
